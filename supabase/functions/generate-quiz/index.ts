import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text) {
      throw new Error('text is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Generating quiz from text (${text.length} characters)`);

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
            content: `당신은 기업 온보딩 자료를 분석하여 퀴즈를 생성하는 전문가입니다.
주어진 텍스트를 분석하여 10-20개의 객관식 문제를 생성하세요.
각 문제는 4개의 선택지를 가지며, 정답은 1개만 있어야 합니다.
각 선택지에는 왜 그것이 정답인지 또는 오답인지 설명하는 해설을 반드시 포함해주세요.`
          },
          {
            role: 'user',
            content: `다음 온보딩 자료의 내용을 바탕으로 퀴즈를 생성해주세요:\n\n${text}`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_quiz_questions',
            description: '온보딩 자료에서 퀴즈 문제를 생성합니다',
            parameters: {
              type: 'object',
              properties: {
                questions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      question_text: { type: 'string' },
                      options: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            text: { type: 'string' },
                            is_correct: { type: 'boolean' },
                            explanation: { type: 'string', description: '이 선택지가 정답인지 오답인지 설명' }
                          },
                          required: ['text', 'is_correct', 'explanation']
                        },
                        minItems: 4,
                        maxItems: 4
                      }
                    },
                    required: ['question_text', 'options']
                  }
                }
              },
              required: ['questions']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'create_quiz_questions' } }
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

    return new Response(
      JSON.stringify({ questions: quizData.questions }),
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
