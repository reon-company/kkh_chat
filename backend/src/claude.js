const FALLBACK_REPLY =
  "죄송해요, 지금은 답변을 드리기 어려워요. 잠시 후 다시 시도해주시거나, 곧 담당자가 직접 연락드릴게요.";

function buildSystemPrompt(leadContext) {
  const base =
    "당신은 보험 설계사를 돕는 상담 어시스턴트입니다. 고객과 편안하고 자연스러운 대화체로 이야기하며, " +
    "보험 관련 궁금증에 친절하게 답하고 필요하면 담당자 상담을 자연스럽게 권유하세요. 답변은 2~4문장 정도로 간결하게 하세요.";

  if (!leadContext) return base;

  const { name, age, answers } = leadContext;
  const qa = (answers || [])
    .map((a) => `- ${a.question} → ${a.answer}`)
    .join("\n");

  return `${base}

방금 "${name}"님(${age}세)이 아래 설문에 답변했습니다. 이 맥락을 참고해서 자연스럽게 대화를 이어가세요.
${qa}`;
}

export async function chatReply(leadContext, history, message) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[claude.js] ANTHROPIC_API_KEY 미설정 - 폴백 답변 사용");
    return FALLBACK_REPLY;
  }

  const messages = [...(history || []), { role: "user", content: message }];

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        system: buildSystemPrompt(leadContext),
        messages,
      }),
    });

    if (!res.ok) {
      console.error("[claude.js] API 오류", res.status, await res.text());
      return FALLBACK_REPLY;
    }

    const data = await res.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return text || FALLBACK_REPLY;
  } catch (err) {
    console.error("[claude.js] 답변 생성 실패, 폴백 사용", err);
    return FALLBACK_REPLY;
  }
}
