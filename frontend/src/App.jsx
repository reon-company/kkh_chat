import { useEffect, useRef, useState } from "react";
import { fetchLeadContext, sendChatMessage } from "./api.js";

function greeting(leadContext) {
  if (!leadContext) return "안녕하세요! 보험에 대해 궁금하신 점을 편하게 물어보세요.";
  return `안녕하세요, ${leadContext.name}님! 방금 답변 주신 내용 잘 봤어요. 더 궁금하신 점 있으면 편하게 물어보세요.`;
}

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

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
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
