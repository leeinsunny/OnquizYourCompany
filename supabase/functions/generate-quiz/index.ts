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
    const { documentId, images } = await req.json();
    
    if (!documentId || !images || images.length === 0) {
      throw new Error('documentId and images are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Processing document ${documentId} with ${images.length} images`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: document } = await supabase
      .from('documents')
      .select('company_id, title, uploaded_by')
      .eq('id', documentId)
      .single();

    if (!document) throw new Error('Document not found');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `당신은 기업 온보딩 자료를 분석하여 카테고리를 추출하고 퀴즈를 생성하는 전문가입니다.
주어진 문서 이미지에서 텍스트를 추출하고, 2-5개의 주요 카테고리를 생성하며, 각 카테고리당 3-5개의 객관식 문제를 생성하세요.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: '다음 온보딩 자료의 모든 텍스트를 추출하고, 내용을 분석하여 카테고리와 퀴즈를 생성해주세요.' },
              ...images.map((imageUrl: string) => ({ type: 'image_url', image_url: { url: imageUrl } }))
            ]
          }
        ],
        tools: [{
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
                      name: { type: 'string' },
                      description: { type: 'string' },
                      quizzes: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            title: { type: 'string' },
                            question: { type: 'string' },
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
                            explanation: { type: 'string' }
                          },
                          required: ['title', 'question', 'options', 'explanation']
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
        }],
        tool_choice: { type: 'function', function: { name: 'create_quiz_structure' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No tool call in AI response');

    const quizData = JSON.parse(toolCall.function.arguments);

    for (const [categoryIndex, category] of quizData.categories.entries()) {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .insert({
          company_id: document.company_id,
          document_id: documentId,
          name: category.name,
          description: category.description,
          order_index: categoryIndex
        })
        .select()
        .single();

      if (categoryError) throw categoryError;

      for (const quiz of category.quizzes) {
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .insert({
            company_id: document.company_id,
            category_id: categoryData.id,
            title: quiz.title,
            description: quiz.question,
            created_by: document.uploaded_by,
            is_active: true,
            pass_score: 70
          })
          .select()
          .single();

        if (quizError) throw quizError;

        const { data: questionData, error: questionError } = await supabase
          .from('quiz_questions')
          .insert({
            quiz_id: quizData.id,
            question_text: quiz.question,
            question_type: 'multiple_choice',
            points: 1,
            order_index: 0
          })
          .select()
          .single();

        if (questionError) throw questionError;

        for (const [optionIndex, option] of quiz.options.entries()) {
          const { error: optionError } = await supabase
            .from('quiz_options')
            .insert({
              question_id: questionData.id,
              option_text: option.text,
              is_correct: option.is_correct,
              explanation: option.is_correct ? quiz.explanation : null,
              order_index: optionIndex
            });

          if (optionError) throw optionError;
        }
      }
    }

    await supabase.from('documents').update({ status: 'approved' }).eq('id', documentId);

    return new Response(
      JSON.stringify({ success: true, categoriesCreated: quizData.categories.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
