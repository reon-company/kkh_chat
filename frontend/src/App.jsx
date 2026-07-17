import { useEffect, useRef, useState } from "react";
import { fetchLeadContext, sendChatMessage } from "./api.js";

function greeting(leadContext) {
  if (!leadContext) return "안녕하세요! 보험에 대해 궁금하신 점을 편하게 물어보세요.";
  return `안녕하세요, ${leadContext.name}님! 방금 답변 주신 내용 잘 봤어요. 더 궁금하신 점 있으면 편하게 물어보세요.`;
}

const CATEGORIES = [
  { emoji: "🩺", label: "실비보험", prompt: "실비보험이 궁금해요. 어떤 건지 설명해주세요." },
  { emoji: "🎗️", label: "암보험", prompt: "암보험에 대해 알고 싶어요." },
  { emoji: "❤️", label: "건강보험", prompt: "건강·질병보험이 궁금해요." },
  { emoji: "👶", label: "어린이보험", prompt: "자녀를 위한 어린이보험이 궁금해요." },
  { emoji: "🚗", label: "운전자보험", prompt: "운전자보험이 필요할까요?" },
  { emoji: "🛡️", label: "종신보험", prompt: "사망보장(종신보험)이 궁금해요." },
  { emoji: "🌅", label: "연금보험", prompt: "노후 대비 연금보험이 궁금해요." },
  { emoji: "💰", label: "저축성보험", prompt: "저축성보험이 궁금해요." },
  { emoji: "📋", label: "가입 점검", prompt: "지금 가입한 보험이 적정한지 점검하고 싶어요." },
];

export default function App() {
  const [leadContext, setLeadContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const leadId = params.get("leadId");
    if (!leadId) {
      setMessages([{ role: "assistant", content: greeting(null) }]);
      return;
    }
    fetchLeadContext(leadId)
      .then((ctx) => {
        setLeadContext(ctx);
        setMessages([{ role: "assistant", content: greeting(ctx) }]);
      })
      .catch(() => {
        setMessages([{ role: "assistant", content: greeting(null) }]);
      });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  const sendText = async (text) => {
    if (!text.trim() || loading) return;
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const { reply } = await sendChatMessage(leadContext, history, text);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError("답변을 받지 못했어요. 잠시 후 다시 시도해주세요.");
    }
    setLoading(false);
  };

  const send = (e) => {
    e.preventDefault();
    sendText(input);
  };

  const hasUserMessage = messages.some((m) => m.role === "user");

  return (
    <div className="page">
      <div className="page-inner">
        <div className="chat-header">
          <div className="eyebrow">AI 보험 상담</div>
          <h1 className="display">무엇이든 편하게 물어보세요</h1>
        </div>
        <div className="chat-scroll" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
          {loading && <div className="bubble assistant loading">답변을 작성하고 있어요...</div>}
          {!hasUserMessage && !loading && (
            <div className="topic-grid">
              {CATEGORIES.map((c) => (
                <button key={c.label} className="topic-btn" onClick={() => sendText(c.prompt)}>
                  <div className="topic-emoji">{c.emoji}</div>
                  <div className="topic-label">{c.label}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        {error && <div className="error-text">{error}</div>}
        <form className="chat-form" onSubmit={send}>
          <input
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요"
          />
          <button className="chat-send" type="submit" disabled={loading || !input.trim()}>
            보내기
          </button>
        </form>
      </div>
    </div>
  );
}
