# DoubtMap — AI Classroom Intelligence

An AI-powered classroom tool that collects anonymous student doubts in real time and uses Featherless AI (`deepseek-ai/DeepSeek-V3.2`) to semantically cluster them into conceptual gaps for teachers to address.

## Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Vite
- **Backend**: Express (TypeScript, via `tsx` in dev)
- **AI**: Featherless AI (OpenAI-compatible) for semantic clustering & teacher insights
- **Animation**: Motion (Framer Motion v12)

## Running the App

```bash
npm run dev
```

Runs on **port 5000**. The workflow "Start application" is configured for this.

## Environment / Secrets

| Key | Purpose |
|-----|---------|
| `FEATHERLESS_API_KEY` | Featherless AI API — required for AI clustering. Set in `.env` or as a Replit Secret. |

## Architecture

- `server.ts` — Express server with in-memory session store, REST API routes, and a server-side simulation loop (interval every 1800ms)
- `src/services/featherless.ts` — Featherless OpenAI-compatible client (retries, JSON validation)
- `src/services/aiClustering.ts` — Featherless API calls for clustering doubts & teacher insights
- `src/components/` — React UI components (Teacher Dashboard, Student View, etc.)
- `src/data/demoDataset.ts` — 100 pre-written student doubts for the live demo

## Key Features

- **Teacher Dashboard**: real-time cluster cards, heatmap, activity feed, AI insight panel
- **Student View**: anonymous doubt submission via classroom code
- **Live Demo**: streams 100 pre-written doubts through the Featherless clustering pipeline
- **Fast Mode**: 5× accelerated demo for presentations

## User Preferences

_None recorded yet._
