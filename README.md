# DoubtMap

AI-powered classroom tool that collects anonymous student doubts in real time and uses **Featherless AI** (`deepseek-ai/DeepSeek-V3.2`) to semantically cluster them into conceptual gaps teachers can address.

## Features

- Anonymous student doubt submission
- Real-time semantic clustering into conceptual gaps
- Teacher dashboard with heat clusters, activity feed, and AI insights
- Live demo with a pre-written Binary Search Trees dataset

## Prerequisites

- Node.js 20+ (recommended; required by Tailwind CSS v4)
- A Featherless AI API key

## How to obtain a Featherless API key

1. Sign up or log in at [https://featherless.ai](https://featherless.ai)
2. Open your account / API settings and create an API key
3. Copy the key (keep it secret — never commit it to GitHub)

## Environment variables

Create a `.env` file in the project root (you can copy `.env.example`):

```env
FEATHERLESS_API_KEY=your_key_here
```

| Variable | Required | Description |
|----------|----------|-------------|
| `FEATHERLESS_API_KEY` | Yes (for live AI) | Featherless API key used for clustering titles, explanations, learning summaries, misconceptions, and teacher insights |
| `PORT` | No | Server port (default `5000`) |

Without a valid key, the app still runs using the local **Standby Hybrid** clustering fallback.

`.env` is already listed in `.gitignore` (`*.env*` with `!.env.example` allowed).

## Setup & run locally

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set FEATHERLESS_API_KEY to your real key

# 3. Start the app (API + Vite on one server)
npm run dev
```

Open [http://localhost:5000](http://localhost:5000).

### Other scripts

```bash
npm run build   # production build
npm start       # run production server from dist/
npm run lint    # TypeScript check
```

## AI provider details

- **Provider:** Featherless AI (OpenAI-compatible)
- **Base URL:** `https://api.featherless.ai/v1`
- **Model:** `deepseek-ai/DeepSeek-V3.2`
- **Used for:** cluster titles, explanations, learning summaries, common misconceptions, suggested next topics, and teacher insights

Clustering grouping logic, embeddings/graph behavior, routing, auth, and UI layout are unchanged — only the LLM provider was swapped from Gemini to Featherless.

## DoubtTone AI (planned)

DoubtTone AI will analyze the **learning intent** behind student doubts (including frustrated/rude wording) before they enter clustering — without acting as a moderation system. Integration plan and architecture notes:

→ [`docs/DOUBTTONE_ARCHITECTURE.md`](docs/DOUBTTONE_ARCHITECTURE.md)

### Backend (Stage 2)

Analyze tone + intent without storing the doubt:

```http
POST /api/sessions/:id/doubts/analyze-tone
Content-Type: application/json

{ "text": "Why is this stupid formula even used? I don't understand it." }
```

Returns `{ success, analysis }` where `analysis` is either a full DoubtTone payload or `{ "analysis_available": false }` on AI failure.
