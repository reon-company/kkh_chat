# 서비스 2 — AI 상담 챗봇

service1(잠재고객 정보수집)에서 설문을 마친 고객이 이어서 자유롭게 질문할 수 있는 AI 상담 챗봇.

## 구조

```
service2-ai-chatbot/
  backend/     Express API 서버 (Claude 호출, service1 리드 컨텍스트 조회)
  frontend/    Vite + React 채팅 화면
```

## 아키텍처 요약

```
[고객 브라우저] (service1 완료 화면의 "AI와 더 상담하기" 링크로 진입, ?leadId=<uuid>)
   → GET  /api/context/:leadId   (service2 백엔드가 service1 백엔드에 리드 이름/나이/설문답변 조회)
   → POST /api/chat              (leadContext + 대화 history + 새 메시지 → Claude 응답)
```

서버는 대화 상태를 저장하지 않음(stateless) — 프론트가 매 요청마다 전체 history를 함께 보냄. `leadId`가 없으면 컨텍스트 없이 일반 상담 모드로 동작.

## 로컬 실행

### 1. 백엔드

```bash
cd backend
npm install
cp .env.example .env
# .env에 ANTHROPIC_API_KEY 채우기, SERVICE1_API_URL은 로컬 service1 백엔드 주소로
npm run dev
```

`http://localhost:4001`에서 API 실행됨.

### 2. 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5174`에서 화면 확인. `?leadId=<service1에서 발급된 lead id>`로 접속하면 개인화된 인사말과 함께 시작.

## 배포 현황

- **프론트엔드**: Vercel (`reonai/kkh-chat` 프로젝트) → https://chat.sonamu.my. `VITE_API_URL=https://chat-api.sonamu.my/api` 환경변수 설정됨.
- **백엔드**: service1과 같은 AWS Lightsail 인스턴스(`~/chat`)에 systemd 서비스(`service2-backend`, 포트 4001)로 상시 실행, nginx + Let's Encrypt로 https://chat-api.sonamu.my 서빙. `SERVICE1_API_URL`은 같은 서버 내부 통신이라 `http://localhost:4000/api` 사용.
- **주의**: 프론트(`chat`)와 백엔드(`chat-api`) 서브도메인을 헷갈리지 말 것 — `chat.sonamu.my`는 Vercel(A레코드 `76.76.21.21`), `chat-api.sonamu.my`는 Lightsail(A레코드 `43.201.119.36`).
- **재배포**: GitHub push → 서버에서 `cd ~/chat && git pull && sudo systemctl restart service2-backend` (프론트는 Vercel 자동 배포).

## 환경변수 요약

**backend/.env**
| 변수 | 설명 |
|---|---|
| `ANTHROPIC_API_KEY` | 채팅 응답 생성용 Claude API 키 |
| `SERVICE1_API_URL` | service1 백엔드 주소 (리드 컨텍스트 조회용) |
| `PORT` | 기본 4001 |

**frontend/.env** (선택)
| 변수 | 설명 |
|---|---|
| `VITE_API_URL` | 기본값 `http://localhost:4001/api` |

## 아직 안 된 것

- [ ] 대화 로그 저장 (현재는 stateless, 상담 이력이 남지 않음)
- [ ] Rate limiting 세분화 (현재 `/api/chat`만 IP당 15분/20회로 제한)
