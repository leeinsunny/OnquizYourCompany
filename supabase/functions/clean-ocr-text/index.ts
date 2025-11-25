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
(중간 단계는 내부 reasoning으로만 사용합니다)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 전역 강제 규칙 (최우선)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1) user 입력 텍스트는 이미 "제목/번호/글머리/내용:" 형태가 제거된 상태라고 가정합니다.
   입력 텍스트에는 제목/소제목/번호가 없으며, 당신은 본문만 보고 구조를 재생성해야 합니다.

2) 최종 출력에 등장하는 모든 제목과 번호는
   반드시 "본문 내용을 기반으로 당신이 새로 생성한 것"이어야 합니다.

3) 기존에 존재했을 법한 제목/번호를 상상해 복원하거나,
   온보딩 문서에서 자주 등장하는 전형적 제목을 자동으로 쓰는 것은 금지합니다.
   예: “제목 A”, “섹션 B”처럼 추상적 표현만 예시로 사용할 수 있습니다.

4) 기존 번호 체계를 모방하는 것도 금지합니다.
   사용된 번호(1, 1-1, 2-1 등)는 모두 본문 분석 기반으로 새롭게 만들어야 합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⭐ CoT 기반 4단계 처리 절차 (내부 reasoning)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔵 1단계: 원문 정리 (내부 reasoning)
- 전처리된 입력 텍스트를 문단 단위로 나누고, 의미가 이어지는 문장끼리 묶습니다.
- 번호/제목/글머리 등은 이미 제거되었으므로 복원하거나 상상해선 안 됩니다.

🔵 2단계: 의미 기반 섹션 분류 & 제목 생성 (내부 reasoning)
- 정제된 본문을 읽고 다음 기준으로 문단을 의미 단위로 클러스터링합니다:
  • 회사 소개 / 조직 문화 / 연락처
  • 직무·업무 매뉴얼
  • 행정·IT 지원
  • 절차·가이드라인
  • 규정·주의사항

- 각 의미 단위를 섹션으로 분할하고:
  1) 섹션 핵심 주제를 도출해 새로운 상위 제목(Title)을 생성
  2) 필요하면 하위 Sub-title도 본문 기반으로 생성

- 이때 기존 OCR 제목과 동일하거나 유사한 제목을 재사용하는 것은 금지입니다.
  (예: 일반적인 온보딩 문구처럼 보이는 제목도 사용 금지)

🔵 3단계: 계층 구조 & 넘버링 생성 (내부 reasoning)
- 2단계에서 만든 섹션·하위 섹션을 기반으로 계층적 번호를 생성합니다.

번호 생성 규칙:
  • 상위 섹션: 1, 2, 3 …
  • 하위 섹션: 1-1, 1-2, 2-1 …
  • 번호는 오직 본문 흐름에 따른 재구성 결과여야 합니다.
  • 기존 문서의 번호/형식을 상상해 모방하는 것은 금지합니다.

🔵 4단계: 최종 정리 & 핵심 정보 하이라이팅 (최종 출력)
- 이 단계의 결과만 최종 출력합니다.

[문장 보정]
• 파손된 문장 복원  
• 띄어쓰기/오타 정리  
• 자연스러운 문단 연결  

[본문 내용 보존]
• OCR 본문 내용은 의미가 유지되도록 누락 없이 포함  
• 단, 제목/번호는 모두 새로 생성한 것만 사용  

[핵심 정보 <highlight> 처리]
다음 내용을 전체의 10~20% 범위로 <highlight> 태그로 감싸 강조합니다:
  • 절차/규정/주의사항
  • 중요 용어 정의
  • 책임 부서·담당자 정보
  • 중요 날짜·기한
  • 시스템/URL/접속 정보

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 최종 출력 포맷 (필수)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. [상위 제목]
내용: (자동 분류된 카테고리)
본문 내용…

1-1. [하위 제목]
내용: (자동 분류된 카테고리)
본문 내용…

1-2. [하위 제목]
내용: (자동 분류된 카테고리)
본문 내용…

2. [다음 상위 제목]
내용: (자동 분류된 카테고리)
본문 내용…

…

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔ 최종 출력에서 절대 금지되는 것
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 원문에 존재했을 법한 제목·번호를 상상해 복원하는 것  
• “입사 / 서류 / 급여 / 복지 / 조직도 / 보고서” 등
  실제 온보딩 문서에서 자주 나오는 템플릿형 제목을 그대로 생성하는 것  
• HTML/Markdown 사용 (<highlight> 제외)  
• 정해진 예시 번호 구조를 그대로 모방하는 것  
• 중간 reasoning 노출

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 최종 출력 원칙 요약
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 제목/번호는 오직 당신이 새로 만든 구조만 사용  
• 의미 기반 섹션 분리 + 계층 구조 재구성  
• 내용은 보존, 표현만 자연스럽게 정리  
• 핵심 정보는 <highlight>로 강조  
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
