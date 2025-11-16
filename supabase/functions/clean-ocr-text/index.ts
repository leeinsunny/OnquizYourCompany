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

    console.log(`Cleaning OCR text (${text.length} characters)`);

    const systemPrompt = `다음에 제공하는 텍스트는 PDF를 OCR한 결과물입니다.  
이 텍스트를 아래 규칙에 따라 "깔끔한 정리본"으로 다시 작성해 주세요.

[규칙]
1. 원래 문서의 구조를 최대한 보존해 주세요.
   - 큰 제목, 소제목, 본문 구조 유지

2. 다음 요소들은 모두 삭제하거나 무시해 주세요.
   - 페이지 번호, 줄번호, 기호
   - 하단의 참고자료 URL 목록, 웹사이트 주소, 각주 인용 부분
   - "https://..."로 시작하는 모든 URL
   - 중간에 깨진 문자나 이상한 토큰
   - HTML 태그 (<div>, <span>, <p>, <br> 등 모든 HTML 마크업)
   - 마크다운 문법 (**, __, ##, [], () 등)
   - XML 태그나 기타 마크업 언어

3. 줄바꿈/띄어쓰기 정리
   - 문장 중간에서 부자연스럽게 끊긴 줄바꿈을 제거하고, 자연스러운 문장으로 이어 붙여 주세요.
   - 단어 중간에 끊긴 경우는 원래 단어로 자연스럽게 합쳐 주세요.
   - 한 문단으로 써야 할 부분은 문단 단위로 정리해 주세요.

4. 내용 변형 금지
   - 요약하거나 각색하지 말고, 원문 내용을 최대한 그대로 사용해 주세요.
   - 의미를 바꾸지 말고, 문장 연결과 띄어쓰기만 자연스럽게 다듬어 주세요.

5. 출력 형식
   - 순수한 텍스트만 반환해 주세요. 모든 마크업, 태그, 특수 문법을 제거한 깔끔한 텍스트여야 합니다.
   - 원본 문서의 내용 구조는 유지하되, 형식 지정 문법은 모두 제거해 주세요.`;

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
            content: systemPrompt
          },
          {
            role: 'user',
            content: text
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const cleanedText = aiResponse.choices?.[0]?.message?.content;
    
    if (!cleanedText) {
      throw new Error('No content in AI response');
    }

    return new Response(
      JSON.stringify({ cleanedText }),
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
