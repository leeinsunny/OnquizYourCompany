// Edge function: format OCR text into structured onboarding document with highlights
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
    if (!text || typeof text !== "string" || !text.trim()) {
      return new Response(
        JSON.stringify({ error: "text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `당신은 기업 온보딩 문서를 구조화하고 편집하는 전문 AI입니다.

입력된 OCR 원문을 다음 4단계로 처리하세요:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1단계: 넘버링 체계 탐지
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 기존 넘버링(1., 1-1., 2-3. 등)이 있는지 확인
- 있으면 → 보존하고 누락/오류 보완
- 없으면 → 내용 분석 후 논리적 계층 구조 생성
  예: "회사 소개" → 1. 회사 소개
      "조직 문화" 단락 → 1-1. 조직 문화 및 가치

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2단계: 섹션 구조 재배치
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
상위 폴더와 하위 섹션 식별:
- 상위 폴더: 1, 2, 3...
- 하위 섹션: 1-1, 1-2, 2-1, 2-3...

"내용: (카테고리)" 블록 검증:
- 제목과 내용:(카테고리)가 일치하는지 확인
- 불일치 시 → 적절한 섹션으로 본문 이동

누락 보완:
- 본문은 있지만 제목/번호 없는 경우
  → 내용 요약해 제목 생성 + 적절한 번호 부여
  예: 본문 "VPN 접속 방법은..." 
      → 3-2. VPN 접속 가이드

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3단계: 내용 정리 및 구조화
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 깨진 문장 복원, 붙은 단어 띄어쓰기 수정
- 문단화 및 목록화 (1., 2., • 등)
- 불필요한 중복 제거
- 자연스러운 한국어로 문장 보정
- 원문 정보는 절대 삭제 금지

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4단계: 핵심 정보 하이라이팅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
다음 요소를 <highlight>...</highlight>로 마킹:
- 용어 정의, 규정, 주의사항
- 요구사항, 기한, 책임 범위
- 연락처, 시스템 이름, 절차 이름
- 전체의 10~20% 범위 유지

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
출력 규칙
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 순수 텍스트만 반환 (HTML/마크다운 금지)
✅ <highlight> 태그만 예외 허용
✅ 재배치된 구조를 명확히 표시:

출력 형식 예시:
1. 회사 소개 및 문화 폴더 (현재 위치)

1-1. 회사 미션과 비전 (2025년 Ver.)
내용: (회사 소개 및 문화)
<본문 내용>

1-2. 조직도 및 연락처
내용: (회사 소개 및 문화)
<본문 내용>

2. 업무 및 직무 매뉴얼 폴더 (현재 위치)

2-1. 핵심 용어 해설
내용: (업무 및 직무 매뉴얼)
<본문 내용>

주의: 섹션 구조는 원문에 맞춰 유연하게 생성하세요. 고정된 형식을 강제하지 마세요.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `OCR 원문:\n\n${text}` },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to Lovable AI." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const ai = await response.json();
    const formattedText: string | undefined = ai.choices?.[0]?.message?.content;
    if (!formattedText) throw new Error("No content in AI response");

    return new Response(
      JSON.stringify({ formattedText }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("format-ocr-text error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
