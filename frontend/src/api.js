const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4001/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "요청에 실패했어요.");
  return data;
}

export function fetchLeadContext(leadId) {
  return request(`/context/${leadId}`);
}

export function sendChatMessage(leadContext, history, message) {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ leadContext, history, message }),
  });
}
