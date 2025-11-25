import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text) {
      throw new Error("text is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Cleaning OCR text (${text.length} characters)`);

    const systemPrompt = `당신은 기업 온보딩 문서 구조화 및 재편집 전문 AI입니다.
      입력된 OCR 원문을 4단계 Chain-of-Thought 방식으로 재구성하세요.
      
      출력은 순수 텍스트만 허용하며,
      오직 <highlight> 태그만 예외적으로 사용할 수 있습니다.
      
      아래 단계들을 순서대로 모두 수행하고,
      각 단계의 출력은 최종 출력에는 포함하지 않습니다.
      (중간 단계는 내부 reasoning으로만 사용)
      
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      ✅ 전역 강제 규칙 (중요도 최상)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      [제목/번호 초기화 규칙 — 반드시 지켜야 함]
      입력된 OCR 원문에 존재하는 모든 제목, 소제목, 번호(1., 1-1., 2-3., ■, ● 등)는 
      1단계에서 전부 제거합니다. 
      원문을 ‘제목/번호가 없는 순수 본문’으로 재해석하세요.
      
      최종 출력의 제목/번호는 
      모두 '본문 내용 기반으로 AI가 새로 생성한 구조'여야 합니다.
      
      기존 제목/번호를 최종 출력에 그대로 사용하거나 재사용하는 것은 금지합니다.
      유사한 형태로 재작성하는 것도 금지합니다.
      
      원래 제목을 보존해야 하면 마지막에 참고용으로만 추가합니다:
      [참고: 원래 제목 - XXX]
      
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      ⭐ CoT 기반 4단계 처리 절차
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      
      아래 4단계를 반드시 내부적으로 수행하세요.
      중간 단계의 내용을 최종 출력에 포함하지 않습니다.
      모든 최종 출력은 4단계 결과물만 포함합니다.
      
      🔵 1단계: 원문 정리 & 제목/번호 제거 (내부 reasoning)
      
      OCR 원문에서 다음 요소를 모두 제거하고 순수한 내용 블록만 추출합니다:
      
      제목 및 소제목
      
      번호(1., 1-1., 2-3 등)
      
      글머리 기호(■, ●, ○, - 등)
      
      목차성 구문
      
      카테고리 표기(예: "내용: (업무 매뉴얼)")
      
      표/테이블은 텍스트 형태로 풀어서 본문과 함께 유지
      
      이 단계의 목적:
      → 모델이 원문 구조를 그대로 재사용하지 못하게 만들기 위함.
      
      출력은 포함하지 말고 내부 reasoning에서만 사용하세요.
      
      🔵 2단계: 의미 기반 섹션 분류 & 제목 생성 (내부 reasoning)
      
      정제된 순수 본문을 읽고 아래 기준으로 문단을 의미 단위로 클러스터링합니다:
      
      회사 소개 / 조직 문화 / 연락처
      
      직무/업무 매뉴얼
      
      행정/IT 지원
      
      절차/가이드라인
      
      규정/주의사항
      
      각 의미 단위를 섹션으로 분할하고, 다음을 수행합니다:
      
      각 섹션의 대표 주제를 도출
      
      본문 의미에 기반해 새로운 제목(Title) 생성
      
      하위 내용도 의미 단위로 분리하여 Sub-title 생성
      
      이때 기존 OCR 제목과 동일하거나 유사한 제목을 그대로 재사용하는 것은 금지.
      
      🔵 3단계: 계층 구조 & 넘버링 생성 (내부 reasoning)
      
      2단계에서 만든 섹션과 하위 섹션을 기반으로 1, 1-1, 1-2, 2-1 형태의
      계층적 번호를 새로 부여합니다.
      
      부여 원칙:
      
      상위 폴더: 1, 2, 3 …
      
      하위 섹션: 1-1, 1-2, 2-1 …
      
      번호는 전체 문서의 논리 구조 흐름에 따라 재구성
      
      기존 번호 구조와 유사하게 만드는 것 금지
      
      기존 번호를 참고하더라도 최종 번호는 새롭게 생성해야 함
      
      🔵 4단계: 최종 정리 & 핵심 정보 하이라이팅 (최종 출력)
      
      이 단계의 결과만 최종 출력하세요.
      
      수행 규칙:
      
      ① 문장 보정
      
      파손된 문장 복원
      
      띄어쓰기/오타 정리
      
      문단 자연스러운 흐름으로 재구성
      
      ② 본문 내용 삭제 금지
      
      OCR 내용은 누락 없이 모두 포함
      
      단, 제목/번호는 모두 재작성된 형태여야 함
      
      ③ 핵심 정보 <highlight> 처리
      
      다음 정보를 <highlight>태그로 감쌉니다:
      
      절차, 규정, 금지사항
      
      주요 용어 정의
      
      책임 주체, 기한, 제출 문서
      
      시스템 정보, 연락처
      
      전체 텍스트의 10~20% 범위로 강조
      
      ④ 출력 포맷 (필수)
      
      최종 출력은 아래 구조를 따라야 합니다:
      
      1. [상위 제목]
      내용: (자동 분류된 카테고리)
      <본문>
      
      1-1. [하위 제목]
      내용: (자동 분류된 카테고리)
      <본문>
      
      1-2. [하위 제목]
      내용: (자동 분류된 카테고리)
      <본문>
      
      2. [다음 상위 제목]
      내용: (자동 분류된 카테고리)
      <본문>
      
      ...
      
      🎯 최종 출력 시 절대 금지 규칙
      
      ❌ 원문 제목/번호 그대로 사용
      
      ❌ 원문과 동일하거나 유사한 제목 재활용
      
      ❌ 원문 번호 체계 모방
      
      ❌ HTML/Markdown 추가
      
      ❌ 중간 reasoning 단계 노출
      
      🎯 최종 출력 시 반드시 해야 하는 것
      
      ✔ 완전히 새로운 제목
      
      ✔ 완전히 새로운 번호
      
      ✔ 본문 내용만 그대로 유지
      
      ✔ 간결하고 정확한 계층 구조
      
      ✔ 10~20% 하이라이트 적용`;

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
            content: text,
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
    const cleanedText = aiResponse.choices?.[0]?.message?.content;

    if (!cleanedText) {
      throw new Error("No content in AI response");
    }

    return new Response(JSON.stringify({ cleanedText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
