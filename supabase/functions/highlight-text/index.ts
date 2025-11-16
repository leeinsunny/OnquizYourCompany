// Edge function: highlight important text in OCR content

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not set');
    }

    const systemPrompt = `당신은 온보딩 문서에서 중요한 정보를 식별하는 전문가입니다.

주어진 텍스트를 분석하여 다음과 같은 중요한 정보를 식별하세요:
- 핵심 개념, 정의
- 중요한 규칙, 절차
- 주의사항, 경고
- 필수 요구사항
- 기한, 날짜
- 책임과 의무

응답 형식:
각 문단을 분석하여 중요한 부분을 <highlight> 태그로 감싸서 반환하세요.
예시: "회사의 <highlight>보안 정책</highlight>을 준수해야 합니다."

원본 텍스트의 구조와 내용을 그대로 유지하되, 중요한 부분만 <highlight> 태그로 표시하세요.
전체 텍스트의 10-20% 정도만 하이라이트하세요.`;

    const response = await fetch('https://api.lovable.app/v1/ai-gateway/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const highlightedText = data.choices[0]?.message?.content;

    if (!highlightedText) {
      throw new Error('Failed to get highlighted text from AI');
    }

    return new Response(
      JSON.stringify({ highlightedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
