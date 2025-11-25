// ocr-clean-text.ts (예시 파일명)

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * OCR 원문에서 제목/번호/글머리/내용: 라인 등을 최대한 기계적으로 제거해서
 * "순수 본문"만 남기는 전처리 함수
 */
function preprocessOcrText(raw: string): string {
  const lines = raw.split("\n");

  const filtered = lines.filter((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      // 빈 줄은 일단 남겨두고 나중에 정리
      return true;
    }

    // 1. "1.", "2.", "3-1." 등 번호+점 형태로 시작하는 줄 제거
    // 예: "1.", "1-1.", "10-2."
    if (/^\d+(-\d+)?\./.test(trimmed)) {
      return false;
    }

    // 2. 글머리 기호(●, ○, ■, -, ▪ 등)로 시작하는 줄 제거
    if (/^[●○■▪\-]/.test(trimmed)) {
      return false;
    }

    // 3. "내용 :" 또는 "내용:" 같은 라인 제거 (카테고리 표기)
    if (/^내용\s*[:：]/.test(trimmed)) {
      return false;
    }

    // 4. "폴더 (현재 위치)" 같은 헤더성 문구도 웬만하면 제거
    //    예: "3. 행정 및 IT 환경 설정 폴더 (현재 위치)" → 1번 조건에도 걸리지만
    //    혹시 번호가 깨진 경우 대비해서 문자 기반도 한 번 더 필터링
    if (/폴더\s*\(현재 위치\)/.test(trimmed)) {
      return false;
    }

    return true;
  });

  // 연속된 빈 줄 2개 이상은 1개로 압축
  const compressed: string[] = [];
  let lastWasEmpty = false;
  for (const line of filtered) {
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

    // 1) 전처리: 제목/번호/글머리/내용: 줄 최대한 제거
    const preprocessed = preprocessOcrText(text);

    console.log(`Original OCR length: ${text.length}`);
    console.log(`Preprocessed length: ${preprocessed.length}`);

    const systemPrompt = `
당신은 '기업 온보딩 문서 분석 전문 AI'입니다.
당신의 유일한 역할은 **온보딩 문서의 각 섹션이 제목과 본문이 서로 잘 맞는지 진단하고 JSON으로 결과를 반환하는 것**입니다.

당신은 문서를 *수정하거나 재구성하거나 번호를 재부여해서는 절대 안 됩니다.*

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

------------------------------------------------------------
📌 당신이 해야 할 작업
------------------------------------------------------------
1) 문서를 섹션 단위로 정확히 분할합니다.
   기준:
   - “1-1.”, “2-3.”, “3-1.” 등 번호 패턴
   - 번호 + 제목 한 줄
   - 그 아래 “내용:”으로 시작하는 본문 블록

2) 각 섹션에 대해 다음 항목을 분석합니다:

   - id: "1-1", "1-2", "3-1" 같은 섹션 번호
   - title: 섹션 제목 (입력 그대로)
   - body: 섹션 본문 (입력 그대로)
   - summary: 본문 내용을 한 문장으로 요약
   - title_body_match:
       "high"   → 제목과 본문이 매우 잘 맞음  
       "medium" → 일부 관련성이 있으나 살짝 어긋남  
       "low"    → 제목과 본문이 본질적으로 일치하지 않음
   - reason:
       match 판정을 내린 이유를 한 줄로 설명
   - suggested_fixed_title:
       title_body_match가 "low"일 때만,
       본문에 더 적합한 새로운 제목을 제안.
       "medium" 또는 "high"일 경우 null.

3) 문서를 '수정'하지 말고, '재구성'하지 말고,
   **오직 JSON 분석 결과만 출력합니다.**

4) JSON 이외의 텍스트는 출력하지 마세요.
   설명문, 서론, 주석, 마크다운, 자연어 설명 모두 금지.

------------------------------------------------------------
📌 출력 형식 (반드시 이 JSON만)
------------------------------------------------------------

[
  {
    "id": "1-1",
    "title": "원래 제목 그대로",
    "body": "원래 본문 그대로",
    "summary": "본문 요약 한 줄",
    "title_body_match": "high | medium | low",
    "reason": "판단 이유 한 줄",
    "suggested_fixed_title": "본문 기반 대체 제목 또는 null"
  },
  ...
]

------------------------------------------------------------
📌 절대 금지 규칙 (어기면 안 됨)
------------------------------------------------------------
- 제목을 새로 생성 X
- 번호를 새로 생성 X
- 문서 구조를 재배열 X
- 카테고리를 생성하거나 수정 X
- 본문 내용을 삭제 또는 편집 X
- 제목과 본문을 다르게 바꾸기 X
- JSON 앞뒤에 부연 설명 추가 X
- JSON 밖의 텍스트 출력 X

당신의 역할은 오직 **진단 + JSON표준화**입니다.
`;

    console.log(`Cleaning OCR text with system prompt (len=${systemPrompt.length})`);

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
            // 🔥 여기서 raw text가 아니라 전처리된 preprocessed 사용
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

    return new Response(JSON.stringify({ cleanedText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in OCR clean function:", error);
    return new Response(JSON.stringify({ error: error.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
