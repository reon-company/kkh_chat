import { Router } from "express";
import rateLimit from "express-rate-limit";
import { chatReply } from "./claude.js";

export const router = Router();

const SERVICE1_API_URL = process.env.SERVICE1_API_URL || "http://localhost:4000/api";

// Claude API 호출 비용/남용 방지: IP당 15분에 20회로 제한
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "요청이 너무 많아요. 잠시 후 다시 시도해주세요." },
});

// service1에 저장된 리드(이름/나이/설문답변) 조회 — 챗봇 초기 인사/컨텍스트용
router.get("/context/:leadId", async (req, res) => {
  try {
    const upstream = await fetch(`${SERVICE1_API_URL}/leads/${req.params.leadId}/context`);
    if (!upstream.ok) return res.status(upstream.status).json(await upstream.json());
    res.json(await upstream.json());
  } catch (err) {
    console.error("[routes.js] 리드 컨텍스트 조회 실패", err);
    res.status(502).json({ error: "리드 정보를 불러오지 못했어요." });
  }
});

// 채팅 메시지 처리 (서버는 대화 상태를 저장하지 않음 — 프론트가 history를 매번 전달)
router.post("/chat", chatLimiter, async (req, res) => {
  const { leadContext, history, message } = req.body || {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message가 필요해요." });
  }
  const reply = await chatReply(leadContext, history, message);
  res.json({ reply });
});
