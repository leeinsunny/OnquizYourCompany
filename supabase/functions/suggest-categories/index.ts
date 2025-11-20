// Edge function: Suggest 3 category paths for onboarding documents

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CategoryPath {
  displayPath: string;
  levels: {
    level1: string;
    level2: string;
    level3: string;
  };
  slugPath: string[];
}

interface SuggestCategoriesResponse {
  suggested_category_paths: CategoryPath[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      company_name,
      onboarding_document_title,
      quiz_title,
      onboarding_document_plaintext,
    } = await req.json();

    if (!onboarding_document_plaintext || !onboarding_document_title) {
      return new Response(
        JSON.stringify({ error: 'Document title and text are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not set');
    }

    const systemPrompt = `당신은 기업 온보딩 자동화 서비스 OnQuiz에서 동작하는 "온보딩 자료 카테고리 추천 AI"입니다.

당신의 역할은, 사용자가 업로드한 온보딩 문서 1개에 대해 다음과 같은 3단계 카테고리(path) 후보 3개를 제안하는 것입니다.

대 카테고리 (level1): 회사/조직 관점의 큰 영역
예: 회사 소개, 조직 문화, 인사/복지, 보안/컴플라이언스, 제품/서비스, 시스템 사용법, 업무 프로세스, 영업/CS, 개발 환경 등

중 카테고리 (level2): 대 카테고리 안의 조금 더 구체적인 주제
예: "인사/복지 > 복리후생 제도", "업무 프로세스 > 발주/정산 절차"

소 카테고리 (level3): 실제 문서가 다루는 세부 내용
예: "연차/휴가 규정", "신입사원 온보딩 일정", "사내 메신저/협업 도구 가이드"

출력 형식:
반드시 아래 JSON 스키마를 그대로 따라야 합니다. 추가적인 텍스트, 설명, 자연어 문장은 절대 포함하지 마세요.

{
  "suggested_category_paths": [
    {
      "displayPath": "대카테고리 > 중카테고리 > 소카테고리",
      "levels": {
        "level1": "대카테고리명",
        "level2": "중카테고리명",
        "level3": "소카테고리명"
      },
      "slugPath": [
        "level1_slug",
        "level2_slug",
        "level3_slug"
      ]
    },
    {
      "displayPath": "대카테고리 > 중카테고리 > 소카테고리",
      "levels": {
        "level1": "대카테고리명",
        "level2": "중카테고리명",
        "level3": "소카테고리명"
      },
      "slugPath": [
        "level1_slug",
        "level2_slug",
        "level3_slug"
      ]
    },
    {
      "displayPath": "대카테고리 > 중카테고리 > 소카테고리",
      "levels": {
        "level1": "대카테고리명",
        "level2": "중카테고리명",
        "level3": "소카테고리명"
      },
      "slugPath": [
        "level1_slug",
        "level2_slug",
        "level3_slug"
      ]
    }
  ]
}

규칙:
- 항상 정확히 3개의 category path를 제안
- 각 path는 반드시 3단계 (level1, level2, level3) 를 모두 가져야 함
- displayPath는 "대카테고리 > 중카테고리 > 소카테고리" 형식
- slugPath는 영문 소문자, 숫자, 밑줄만 사용 [a-z0-9_]+
- 카테고리 이름에 회사 이름을 넣지 마세요
- 여러 문서에 재사용 가능한 일반적인 범주 이름 사용`;

    const userPrompt = `
회사명: ${company_name || '알 수 없음'}
온보딩 자료 제목: ${onboarding_document_title}
퀴즈 제목: ${quiz_title || '없음'}

문서 내용:
${onboarding_document_plaintext.substring(0, 8000)}
`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Failed to get category suggestions from AI');
    }

    console.log('AI Response:', content);

    // Parse JSON from AI response
    let suggestedCategories: SuggestCategoriesResponse;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      suggestedCategories = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse category suggestions from AI');
    }

    // Validate response structure
    if (!suggestedCategories.suggested_category_paths || 
        !Array.isArray(suggestedCategories.suggested_category_paths) ||
        suggestedCategories.suggested_category_paths.length !== 3) {
      throw new Error('Invalid category suggestions format');
    }

    return new Response(
      JSON.stringify(suggestedCategories),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in suggest-categories:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
