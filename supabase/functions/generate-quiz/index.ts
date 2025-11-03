import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, extractedText } = await req.json();
    
    if (!documentId || !extractedText) {
      throw new Error('documentId and extractedText are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Supabase 클라이언트 초기화
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 문서 정보 가져오기
    const { data: document } = await supabase
      .from('documents')
      .select('company_id, title')
      .eq('id', documentId)
      .single();

    if (!document) {
      throw new Error('Document not found');
    }

    // AI를 사용하여 카테고리와 퀴즈 생성
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `당신은 기업 온보딩 자료를 분석하여 카테고리를 추출하고 퀴즈를 생성하는 전문가입니다.
주어진 텍스트에서 2-5개의 주요 카테고리를 추출하고, 각 카테고리당 3-5개의 객관식 문제를 생성하세요.
각 문제는 4개의 선택지를 가지며, 하나만 정답입니다.`
          },
          {
            role: 'user',
            content: `다음 온보딩 자료를 분석하여 카테고리와 퀴즈를 생성해주세요:\n\n${extractedText.substring(0, 10000)}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_quiz_structure',
              description: '온보딩 자료에서 카테고리와 퀴즈를 생성합니다',
              parameters: {
                type: 'object',
                properties: {
                  categories: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', description: '카테고리 이름' },
                        description: { type: 'string', description: '카테고리 설명' },
                        quizzes: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              question: { type: 'string', description: '문제 내용' },
                              options: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    text: { type: 'string' },
                                    is_correct: { type: 'boolean' }
                                  },
                                  required: ['text', 'is_correct']
                                },
                                minItems: 4,
                                maxItems: 4
                              },
                              explanation: { type: 'string', description: '정답 설명' }
                            },
                            required: ['question', 'options', 'explanation']
                          }
                        }
                      },
                      required: ['name', 'description', 'quizzes']
                    }
                  }
                },
                required: ['categories']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'create_quiz_structure' } }
      }),
    });

    const aiResult = await response.json();
    console.log('AI Response:', JSON.stringify(aiResult, null, 2));

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const quizData = JSON.parse(toolCall.function.arguments);

    // 데이터베이스에 카테고리와 퀴즈 저장
    for (const categoryData of quizData.categories) {
      // 카테고리 생성
      const { data: category } = await supabase
        .from('categories')
        .insert({
          company_id: document.company_id,
          document_id: documentId,
          name: categoryData.name,
          description: categoryData.description
        })
        .select()
        .single();

      if (!category) continue;

      // 퀴즈 생성
      const { data: quiz } = await supabase
        .from('quizzes')
        .insert({
          company_id: document.company_id,
          category_id: category.id,
          title: `${categoryData.name} 퀴즈`,
          description: categoryData.description,
          created_by: document.company_id, // 시스템 생성
          is_active: false // 관리자 승인 전까지 비활성
        })
        .select()
        .single();

      if (!quiz) continue;

      // 문제와 선택지 생성
      for (let i = 0; i < categoryData.quizzes.length; i++) {
        const questionData = categoryData.quizzes[i];
        
        const { data: question } = await supabase
          .from('quiz_questions')
          .insert({
            quiz_id: quiz.id,
            question_text: questionData.question,
            order_index: i
          })
          .select()
          .single();

        if (!question) continue;

        // 선택지 생성
        const options = questionData.options.map((opt: any, idx: number) => ({
          question_id: question.id,
          option_text: opt.text,
          is_correct: opt.is_correct,
          order_index: idx,
          explanation: opt.is_correct ? questionData.explanation : null
        }));

        await supabase.from('quiz_options').insert(options);
      }
    }

    // 문서 상태 업데이트
    await supabase
      .from('documents')
      .update({ status: 'approved' })
      .eq('id', documentId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        categoriesCount: quizData.categories.length,
        message: 'Quiz generation completed successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-quiz:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
