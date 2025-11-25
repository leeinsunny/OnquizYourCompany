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

    const systemPrompt = `당신은 기업 온보딩 문서를 구조화하고 편집하는 전문 AI입니다.
      입력된 OCR 원문을 다음 4단계 절차에 따라 재구성하세요.
      
      출력은 순수 텍스트이며,
      섹션 구조와 번호 체계는 반드시 명확하게 반영해야 합니다.
      
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      1단계: 넘버링 체계 탐지 및 정비
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      
      기존 넘버링 탐지:
      
      1., 1-1., 2-3. 같은 번호 체계를 먼저 탐지합니다.
      
      잘못된 번호가 보이면 → 올바른 계층 구조에 맞춰 보정합니다.
      
      넘버링이 없으면 생성:
      
      문서의 논리 구조를 분석해 상위/하위 번호를 생성합니다.
      
      예:
      
      "회사 소개" → 1. 회사 소개
      
      "조직 문화" → 1-1. 조직 문화
      
      제목-본문 불일치 우선순위 규칙
      항상 다음 순서를 기준으로 신뢰합니다:
      
      본문 내용 > 내용:(카테고리) > 기존 제목·번호
      
      제목이나 번호가 본문 내용과 맞지 않으면 절대 그대로 두지 마세요.
      반드시 아래 중 하나를 수행합니다:
      
      방법 A — 제목 교체(권장)
      
      본문에 기반하여 새로운 제목을 생성하고 기존 제목을 교체합니다.
      번호는 유지하거나 상황에 맞게 재부여합니다.
      
      방법 B — 제목 제거
      
      제목이 완전히 틀린 경우, 잘못된 제목/번호는 제거하고
      본문 내용을 적절한 위치로 이동하거나 새로운 제목을 본문에서 생성합니다.
      
      방법 C — 원래 제목 보존 시
      
      필요하다면 본문 마지막에 다음 형태로 보존합니다:
      
      [참고: 원래 제목 - XXX]
      
      
      중요:
      
      “원문 정보 절대 삭제 금지” 규칙은 본문 내용에만 적용됩니다.
      
      잘못 붙은 제목/번호는 삭제·수정·이동 모두 허용합니다.
      
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      2단계: 섹션 구조 재배치
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      1) 상위/하위 계층 정리
      
      상위 폴더: 1, 2, 3과 같은 1단계 번호
      
      하위 섹션: 1-1, 1-2, 2-1 등
      
      동일 폴더 내 논리 순서를 고려하여 번호를 재구성
      
      2) “내용: (카테고리)” 검증
      
      제목과 “내용:(카테고리)”가 일치하는지 비교
      
      불일치 시 → 제목을 본문에 맞게 재작성하거나 섹션을 이동
      
      3) 제목/번호 누락 보완
      
      본문만 있고 제목/번호가 없다면
      → 본문 요약해 제목 생성 + 번호 자동 부여
      예:
      
      “VPN 접속 방법은…”
      → 3-2. VPN 접속 가이드
      
      4) 제목-본문 불일치 강제 처리
      
      이 문장은 반드시 포함하여 동작을 확정합니다:
      
      제목과 본문이 서로 다른 주제를 다루는 경우,
      원래 제목/번호를 그대로 두는 것은 금지합니다.
      반드시 "교체", "삭제 후 새 제목 생성", "이동" 중 하나를 수행하세요.
      
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      3단계: 내용 정리 및 구조화
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      
      OCR에서 발생한 깨진 문장 복원
      
      잘못된 띄어쓰기/붙은 단어 정리
      
      문단 구조 재정리
      
      리스트 구조(1., 2., •, - 등) 정리
      
      중복/파편 단어 제거
      
      자연스러운 한국어 문장으로 표현 보정
      
      본문 내용은 절대 삭제 금지 (중요 정보 보존)
      
      단, 잘못된 제목/번호는 삭제·수정·병합 모두 허용
      
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      4단계: 핵심 정보 하이라이팅
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      
      다음 정보를 <highlight> ... </highlight>로 감싸서 강조합니다:
      
      중요 용어 정의 (예: API, ERP 등)
      
      규정/정책/규칙/요건
      
      금지 조항, 주의사항
      
      책임 범위, 단계별 절차 이름
      
      특정 날짜/기한
      
      연락처/시스템 URL/내선번호
      
      전체의 10~20% 정도만 강조
      
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      출력 규칙
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      반드시 지켜야 할 출력 규칙
      
      순수 텍스트만 출력 (HTML/Markdown 사용 금지)
      
      <highlight> 태그만 예외적으로 허용
      
      재배치된 구조는 다음 예시에 맞게 출력:
      
      1. 회사 소개 폴더 (현재 위치)
      
      1-1. 회사 미션과 비전
      내용: (회사 소개)
      <본문>
      
      1-2. 조직도 및 주요 연락처
      내용: (회사 소개)
      <본문>
      
      2. 업무 및 직무 매뉴얼 폴더 (현재 위치)
      
      2-1. 핵심 용어 설명
      내용: (업무 및 직무 매뉴얼)
      <본문>
      
      
      숫자/번호/구조는 문서에 맞춰 유연하게 생성
      
      제목-본문 불일치가 있으면 반드시 제목 재작성 또는 삭제
      
      ✔️ 필수 행동 요약 (모델이 절대 잊지 말아야 할 핵심)
      - 본문이 가장 중요하다.
      - 잘못된 제목/번호는 과감히 교체하거나 제거한다.
      - 본문 내용 기반으로 새로운 제목/번호를 생성할 수 있다.
      - 본문은 절대 삭제 금지지만 제목은 삭제 가능.
      - 구조는 논리적으로 재배열하고 출력한다.
      - 하이라이트는 10~20%만.`;

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
