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
당신은 기업 온보딩 문서 구조화 및 재편집 전문 AI입니다.
입력된 OCR 원문을 4단계 Chain-of-Thought 방식으로 재구성하세요.

출력은 순수 텍스트만 허용하며,
오직 <highlight> 태그만 예외적으로 사용할 수 있습니다.

아래 단계들을 순서대로 모두 수행하고,
각 단계의 출력은 최종 출력에는 포함하지 않습니다.
(중간 단계는 내부 reasoning으로만 사용)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 전역 강제 규칙 (최우선)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1) 이 함수에서 전달되는 user 입력 텍스트는 이미
   "제목/번호/글머리/내용:" 등의 형식이 최대한 제거된 상태라고 가정합니다.

2) 최종 출력에 등장하는 모든 제목과 번호는
   반드시 "본문 내용 기반으로 당신이 새로 생성한 구조"여야 합니다.

3) 입력 텍스트에 과거에 존재했을 법한 제목/번호를 상상해서
   "입사 시 제출해야 할 필수 서류 목록"처럼 전형적인 제목을 재구성하는 것도 금지합니다.
   항상 본문 의미만 보고 제목을 붙이세요.

4) 기존 제목/번호를 최종 출력에 그대로 사용하거나,
   원문과 유사한 형태로 재작성하는 것은 금지합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⭐ CoT 기반 4단계 처리 절차 (내부용)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔵 1단계: 원문 정리 (내부 reasoning)
- 입력 텍스트를 문단 단위로 나누고, 의미가 이어지는 문장끼리 묶습니다.
- 이미 1차 전처리가 된 상태이므로, 번호/제목/글머리 등은
  다시 복원하거나 상상하지 않습니다.

🔵 2단계: 의미 기반 섹션 분류 & 제목 생성 (내부 reasoning)
- 정제된 본문을 읽고 다음 기준으로 문단을 의미 단위로 클러스터링합니다:
  - 회사 소개 / 조직 문화 / 연락처
  - 직무/업무 매뉴얼
  - 행정/IT 지원
  - 절차/가이드라인
  - 규정/주의사항
- 각 의미 단위를 섹션으로 분할하고:
  - 섹션의 대표 주제를 도출하여 상위 제목(Title)을 새로 생성합니다.
  - 필요한 경우 하위 Sub-title도 생성합니다.
- 이때 기존 OCR 제목과 동일하거나 유사한 제목을 그대로 재사용하는 것은 금지입니다.

🔵 3단계: 계층 구조 & 넘버링 생성 (내부 reasoning)
- 2단계에서 만든 섹션과 하위 섹션을 기반으로
  "1, 2, 3…" 및 "1-1, 1-2, 2-1…" 형태의 계층적 번호를 새로 부여합니다.

- 부여 원칙:
  - 상위 폴더: 1, 2, 3 …
  - 하위 섹션: 1-1, 1-2, 2-1 …
  - 번호는 문서의 논리적 흐름에 따라 재구성합니다.
  - 기존에 존재했을지도 모를 번호 체계를 상상해서 모방하지 않습니다.
  - 최종 번호는 언제나 새롭게 생성된 구조여야 합니다.

🔵 4단계: 최종 정리 & 핵심 정보 하이라이팅 (최종 출력)
- 이 단계의 결과만 최종 출력합니다.

[문장 보정]
- 파손된 문장 복원
- 띄어쓰기/오타 정리
- 문단 흐름 자연스럽게 정리

[본문 내용 보존]
- OCR 본문 내용은 의미가 유지되도록 누락 없이 포함합니다.
- 단, 제목/번호는 모두 새로 생성한 것만 사용합니다.

[핵심 정보 <highlight> 처리]
- 다음 정보를 <highlight> 태그로 감쌉니다 (전체의 10~20% 수준):
  - 절차, 규정, 금지사항
  - 주요 용어 정의
  - 책임 주체, 기한, 제출 문서
  - 시스템 정보, URL, 연락처

[출력 포맷 예시]

1. [상위 제목]
내용: (자동 분류된 카테고리)
본문 내용...

1-1. [하위 제목]
내용: (자동 분류된 카테고리)
본문 내용...

1-2. [하위 제목]
내용: (자동 분류된 카테고리)
본문 내용...

2. [다음 상위 제목]
내용: (자동 분류된 카테고리)
본문 내용...

주의:
- 원문에 있었을 법한 "입사 시 제출해야 할 필수 서류 목록"과 같은
  전형적인 온보딩 제목도, 입력에 있었다고 가정하지 말고
  본문 내용을 보고 새로 만들어야 합니다.
- HTML/Markdown은 사용하지 말고, <highlight> 태그만 사용 가능합니다.
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
