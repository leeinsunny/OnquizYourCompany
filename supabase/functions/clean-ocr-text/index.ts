// ocr-analyze-sections.ts (기존 파일명 그대로 써도 됨)

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
당신은 '기업 온보딩 문서 분석 전문 AI'입니다.
당신의 유일한 역할은 온보딩 문서의 각 섹션이 제목과 본문이 서로 잘 맞는지 진단하고,
그 결과를 JSON 배열로 반환하는 것입니다.

당신은 문서를 수정하거나, 재구성하거나, 번호를 재부여해서는 절대 안 됩니다.

------------------------------------------------------------
📌 입력 형식 (user message)
------------------------------------------------------------
사용자는 온보딩 문서를 다음과 같은 형태로 제공합니다:

1-1. 섹션 제목
내용: (카테고리)
여기에 본문 텍스트...

1-2. 다른 섹션 제목
내용: (카테고리)
여기에 본문 텍스트...

이런 식으로 여러 섹션이 이어질 수 있습니다.

번호는 "1-1.", "2-3.", "3-1."과 같이 앞에 위치하며,
그 다음 줄에 제목, 그 아래 "내용:"으로 시작하는 본문 블록이 온다고 가정하십시오.

------------------------------------------------------------
📌 당신이 해야 할 작업
------------------------------------------------------------
1) 문서를 섹션 단위로 정확히 분할합니다.
   - id: "1-1", "1-2", "3-1" 등 번호 부분
   - title: 번호 뒤에 오는 제목 줄 전체
   - body: 해당 섹션의 본문 (다음 번호/제목이 나오기 전까지의 텍스트 전체)

2) 각 섹션에 대해 다음 항목을 분석합니다:

   - id: "1-1", "1-2", "3-1" 같은 섹션 번호
   - title: 섹션 제목 (입력 그대로)
   - body: 섹션 본문 (입력 그대로)
   - summary: 본문 내용을 한 문장으로 요약 (한국어)
   - title_body_match:
       "high"   → 제목과 본문이 매우 잘 맞음  
       "medium" → 일부 관련성은 있지만 살짝 어긋남  
       "low"    → 제목과 본문이 본질적으로 일치하지 않음
   - reason:
       match 판정을 내린 이유를 한국어 한 줄로 설명
   - suggested_fixed_title:
       title_body_match가 "low"일 때만,
       본문 내용에 더 잘 맞는 새로운 제목을 한 줄로 제안.
       "medium" 또는 "high"일 경우에는 null로 설정.

3) 문서를 '수정'하지 말고, '재구성'하지 말고,
   오직 분석 결과를 JSON으로만 출력합니다.

4) JSON 이외의 텍스트는 출력하지 마십시오.
   - 설명문, 서론, 주석, 마크다운, 코드블록, 자연어 설명 모두 금지
   - 출력 전체가 유효한 JSON 배열이어야 합니다.

------------------------------------------------------------
📌 출력 형식 (반드시 이 JSON만)
------------------------------------------------------------

[
  {
    "id": "1-1",
    "title": "원래 제목 그대로",
    "body": "원래 본문 그대로",
    "summary": "본문 요약 한 줄",
    "title_body_match": "high" | "medium" | "low",
    "reason": "판단 이유 한 줄",
    "suggested_fixed_title": "본문 기반 대체 제목 또는 null"
  },
  ...
]

------------------------------------------------------------
📌 절대 금지 규칙
------------------------------------------------------------
- 제목을 새로 생성하여 원본을 대체하지 마십시오.
- 번호를 새로 만들거나 변경하지 마십시오.
- 문서 구조(섹션 순서)를 재배열하지 마십시오.
- 카테고리 내용을 생성하거나 수정하지 마십시오.
- 본문 내용을 삭제하거나 수정하지 마십시오.
- JSON 앞뒤에 다른 텍스트를 추가하지 마십시오.
- JSON을 코드블록(\`\`\`) 안에 넣지 마십시오.

당신의 역할은 오직 "진단 + JSON 표준화"입니다.
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
            // ⚠️ 구조 정보를 살린 preprocessed 사용
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
    const cleanedText = aiResponse?.choices?.[0]?.message?.content;

    if (!cleanedText) {
      throw new Error("No content in AI response");
    }

    // 프론트/백엔드에서 cleanedText를 JSON.parse 해서 사용하면 됨
    return new Response(JSON.stringify({ cleanedText }), {
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
