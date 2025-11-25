// ocr-analyze-sections.ts

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * OCR 텍스트를 분석용으로 가볍게 정리하는 함수
 * - 번호/제목/내용: 같은 구조 정보는 절대 제거하지 않는다.
 * - 너무 지저분한 공백, 중복 빈 줄 정도만 정리.
 */
function preprocessForAnalysis(raw: string): string {
  const lines = raw.split("\n").map((line) => line.replace(/\s+$/g, "")); // 뒤 공백 제거

  const compressed: string[] = [];
  let lastWasEmpty = false;

  for (const line of lines) {
    const isEmpty = line.trim().length === 0;
    if (isEmpty) {
      if (!lastWasEmpty) {
        compressed.push("");
      }
      lastWasEmpty = true;
    } else {
      compressed.push(line);
      lastWasEmpty = false;
    }
  }

  return compressed.join("\n").trim();
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = (await req.json()) as { text?: string };

    if (!text) {
      throw new Error("text is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // 1) 전처리: 구조 정보는 유지한 채, 공백만 정리
    const preprocessed = preprocessForAnalysis(text);

    console.log(`Original OCR length: ${text.length}`);
    console.log(`Preprocessed length: ${preprocessed.length}`);

    const systemPrompt = `
const systemPrompt = `
당신은 '기업 온보딩 문서 구조화 전문 AI'입니다.
당신의 역할은 **온보딩 문서를 섹션 단위로 나누고, 각 섹션에 번호(id)와 제목(title)을 붙여 JSON으로 반환하는 것**입니다.

중요:
- 원문 전체를 그대로 복붙해서 다시 출력하지 마십시오.
- 최종 출력은 반드시 JSON 배열 하나여야 합니다.
- JSON 바깥의 텍스트(설명, 주석, 마크다운 등)는 절대 출력하지 마십시오.

------------------------------------------------------------
📌 입력 형식 (user message)
------------------------------------------------------------
사용자는 온보딩 문서를 "순수 텍스트"로 제공합니다.
문서에는 다음과 같은 경우가 섞여 있을 수 있습니다:

1) 번호와 제목이 이미 있는 경우
   예:
   "1-1. 보안 규정 안내
    내용: (IT/보안) ..."

2) 번호/제목이 전혀 없는 경우
   예:
   "회사는 신규 입사자에게 기본 장비를 제공하며...
    사내 복지 제도에는 식대 지원, 교육비 지원...
    근태 관리는 Google Calendar 기반으로...
    보안 규정에 따라 사내 시스템 접속 시 MFA 인증이 필요하며..."

3) 일부만 번호/제목이 있고 일부는 없는 혼합 형태

4) 테스트용 문서처럼, "첫 번째 본문:", "두 번째 본문:", "세 번째 본문:"과 같이
   단순히 구분을 위한 라벨이 들어간 경우도 있습니다.
   이 경우 이 라벨들은 **섹션 제목으로 사용하지 말고 버리십시오.**
   - 즉, "첫 번째 본문:", "두 번째 본문:" 같은 표현은
     섹션 제목에도, 섹션 본문에도 포함하지 않는 것이 원칙입니다.

------------------------------------------------------------
📌 섹션 분할 규칙
------------------------------------------------------------

1) 먼저, 번호가 명시된 헤더 패턴을 찾습니다.
   - 예: "1-1.", "2-3.", "3.", "10-2." 등
   - 번호 패턴이 있는 줄은 "새 섹션의 시작"으로 간주합니다.
   - 이 경우:
     - id: "1-1" (점(.) 제거)
     - title: 번호 뒤에 나오는 문자열 전체 (양쪽 공백 제거)
     - body: 그 다음 줄부터, 다음 번호가 나오기 전까지의 내용 전체

2) 위와 같은 번호 패턴이 **하나도 없는 경우**,
   즉, "완전히 번호/제목 없는 온보딩 본문" 또는
   "첫 번째 본문: ..., 두 번째 본문: ..."처럼 라벨만 있는 경우라면:

   - "첫 번째 본문:", "두 번째 본문:", "세 번째 본문:", "네 번째 본문:" 등은
     모두 **섹션 구분을 위한 힌트일 뿐이며, 섹션 제목/본문에 포함하지 않습니다.**
     예:
       "첫 번째 본문: 회사는 신규 입사자에게 ..."
       → title/body를 만들 때 "첫 번째 본문:"은 제거한 뒤,
         나머지 텍스트만 가지고 제목과 본문을 구성합니다.

   - 섹션 분할 기준:
     - "첫 번째 본문:", "두 번째 본문:"과 같은 라벨이 있다면,
       각 라벨 이후의 텍스트를 하나의 섹션으로 간주합니다.
     - 라벨이 전혀 없고, 단락이 줄바꿈으로 나뉘어 있다면,
       의미상 자연스러운 단위(장비/복지/근태/보안 등)로 섹션을 나눕니다.

   - 이 경우 섹션 id는 다음과 같이 생성합니다:
     - 첫 번째 섹션: "1-1"
     - 두 번째 섹션: "1-2"
     - 세 번째 섹션: "1-3"
     - ... 이런 식으로 순차 번호를 부여합니다.

   - title 생성 규칙:
     - 섹션의 첫 문장을 기반으로, 의미를 잘 대표하는 핵심 제목을 한 줄로 만듭니다.
     - 예:
       - 장비 지급 내용 → "신규 입사자 장비 지급 안내"
       - 복지 제도 내용 → "사내 복지 제도 요약"
       - 근태/캘린더 내용 → "근태 관리 및 캘린더 기록"
       - 보안/MFA 내용 → "사내 시스템 보안 및 MFA 정책"

   - body 생성 규칙:
     - "첫 번째 본문:", "두 번째 본문:" 등의 라벨을 제거한 뒤 남는 텍스트 전체를 body로 사용합니다.
     - body 안에 "첫 번째 본문", "두 번째 본문"이라는 표현이 다시 등장하지 않아야 합니다.

------------------------------------------------------------
📌 JSON 필드 정의
------------------------------------------------------------

각 섹션은 아래 구조를 갖습니다:

{
  "id": "1-1",
  "title": "섹션 제목 (한 줄)",
  "body": "이 섹션에 해당하는 원문 본문 전체"
}

세부 규칙:
- id:
  - 이미 번호가 있는 경우 → 기존 번호를 기반으로 "1-1" 형식으로 사용 (점 제거).
  - 번호가 전혀 없는 문서일 경우 → "1-1", "1-2", "1-3" ... 순차 생성.
- title:
  - 번호/제목이 있는 문서:
    - 번호 줄에서 번호 뒤에 오는 문자열 전체를 제목으로 사용.
    - 예: "1-1. 보안 규정 안내" → title: "보안 규정 안내"
  - 번호/제목이 없는 문서:
    - 해당 섹션 본문을 읽고, 의미를 잘 대표하는 핵심 제목을 한 줄로 새로 생성.
    - 이때 "첫 번째 본문", "두 번째 본문" 같은 표현은 사용하지 않습니다.
- body:
  - 해당 섹션에 속하는 본문 전체를 그대로 넣습니다.
  - 다만 "1-1. 제목...", "첫 번째 본문:" 같은 헤더/라벨 줄 자체는 body에서 제외합니다.
  - body 안의 문장은 의미를 바꾸지 않는 선에서만 그대로 유지합니다.

------------------------------------------------------------
📌 출력 형식 (반드시 이 JSON만)
------------------------------------------------------------

[
  {
    "id": "1-1",
    "title": "섹션 제목",
    "body": "섹션 본문 전체"
  },
  {
    "id": "1-2",
    "title": "다음 섹션 제목",
    "body": "다음 섹션 본문 전체"
  }
  ...
]

- JSON 바깥에 설명/텍스트를 절대 추가하지 마십시오.
- 코드블록(\`\`\`)으로 감싸지 마십시오.
- 유효한 JSON 배열이 아니면 안 됩니다.

------------------------------------------------------------
📌 절대 금지 규칙
------------------------------------------------------------
- 원문 전체를 그대로 다시 출력하지 마십시오.
- JSON 외의 텍스트를 출력하지 마십시오.
- 섹션 body 내용을 임의로 삭제하거나 축약하지 마십시오.
- 섹션 순서를 임의로 섞지 마십시오.
- "첫 번째 본문", "두 번째 본문" 등의 라벨을
  title이나 body에 그대로 남겨두지 마십시오.

당신의 역할은 오직
"온보딩 텍스트 → 섹션 단위 JSON(id/title/body)" 변환입니다.
`;


    console.log(`Analyzing OCR text with system prompt (len=${systemPrompt.length})`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            // 구조 정보를 살린 preprocessed 사용
            content: preprocessed,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse?.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("No content in AI response");
    }

    let sections: any[] | null = null;
    try {
      sections = JSON.parse(aiContent);
    } catch (e) {
      console.error("Failed to parse AI JSON:", e, aiContent);
    }

    // 섹션 파싱에 실패하면, 그냥 전처리된 원문을 그대로 반환 (fallback)
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      console.warn("AI returned no sections, fallback to preprocessed text");
      return new Response(JSON.stringify({ cleanedText: preprocessed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 섹션 JSON을 이용해서 최종 텍스트 재구성
    const lines: string[] = [];

    for (const s of sections) {
      const id = (s.id ?? "").toString().trim() || "(id 없음)";
      const title = (s.title ?? "").toString().trim() || "제목 없음";
      const body = (s.body ?? "").toString().trim();

      lines.push(`${id}. ${title}`);
      if (body) {
        lines.push(body);
      }
      lines.push(""); // 섹션 간 빈 줄
    }

    const finalText = lines.join("\n").trim();

    return new Response(JSON.stringify({ cleanedText: finalText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in OCR analyze function:", error);
    return new Response(JSON.stringify({ error: error.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
