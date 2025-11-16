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

    const systemPrompt = `당신은 기업 온보딩 문서를 편집하는 전문 에디터입니다.

다음 "OCR 원문"을 바탕으로, 사원이 빠르게 이해할 수 있도록 전체 구조를 재구성해 주세요. 원문의 정보는 누락 없이 모두 보존하되, 읽기 쉽도록 재배열/문단화/목록화/띄어쓰기/문장부호를 정리합니다.

필수 규칙:
1) 내용 삭제 금지: 의미 손실 없이 자연스러운 한국어로 정리
2) 구조 복원: 대주제/소제목/단락/목록(1., 2., 3. / •) 재구성
3) 용어/규칙/주의/요구사항/기한/책임 등은 <highlight>…</highlight>로 표시 (전체의 10~20% 범위)
4) 불필요한 중복·깨진 문장 보정, 붙은 단어는 띄어쓰기 복원
5) 출력은 순수 텍스트로만 반환 (HTML/마크다운 금지)
6) 섹션 제목은 아래 형식으로 고정하며, 내용은 원문에서 재배치:

출력 형식(고정):
제목
섹션 1 (개요)
섹션 2 (상품/카탈로그)
섹션 3 (주문/결제)
섹션 4 (물류/배송)
섹션 5 (검색/트래킹)
핵심 요약 (Highlight Summary)

주의: <highlight> 태그 외 다른 태그/기호/마크업은 사용하지 마세요.`;

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
