# DoubtTone AI — Architecture Inspection & Integration Plan

> Stage 1 inspection only. Feature not implemented yet.
> Date of inspection: aligned with commit `docs: inspect DoubtMap architecture for DoubtTone AI`.

## Architecture discovered

| Layer | Stack |
|-------|--------|
| Frontend | React 19 + TypeScript + Vite 6 + Tailwind CSS v4 |
| Backend | Express 4 in `server.ts` (same process as Vite middleware in dev) |
| Routing | Client view state in `App.tsx` (`landing` \| `teacher` \| `student`) — no React Router |
| Persistence | In-memory `Map` session store (no database) |
| AI provider | **Featherless AI** (`deepseek-ai/DeepSeek-V3.2`) via `src/services/featherless.ts` — Gemini has already been removed |

## Relevant files

| Area | Path |
|------|------|
| Server / APIs | `server.ts` |
| App shell & polling | `src/App.tsx` |
| Types | `src/types.ts` |
| AI client | `src/services/featherless.ts` |
| Clustering + teacher insight | `src/services/aiClustering.ts` |
| Student submit UI | `src/components/StudentView.tsx` |
| Teacher cluster UI | `HeatmapGrid.tsx`, `ClusterCard.tsx`, `SemanticConnectionModal.tsx`, `TeacherInsightPanel.tsx` |
| Env | `.env.example` → `FEATHERLESS_API_KEY` |

## Current doubt → cluster flow

1. Student submits text in `StudentView` → `App.handleSubmitStudentDoubt`
2. `POST /api/sessions/:id/doubts` stores raw `Doubt.text`
3. `refreshSessionClustering` → `clusterDoubts()` (Featherless or standby local fallback)
4. Teacher dashboard polls `GET /api/sessions/:id` and renders heat-ranked cluster cards

## Where DoubtTone AI will integrate

| Stage | Integration point |
|-------|-------------------|
| **2 — Backend** | New service (e.g. `src/services/doubtTone.ts`) reusing `featherlessChatJson`; new analyze API on Express |
| **3 — Student UX** | `StudentView` + `App` submit path: analyze → optional rephrase card → submit original or improved text + metadata |
| **4 — Clustering** | Extend `Doubt` / cluster inputs so `clusterDoubts` prefers `underlying_doubt` / conceptual intent; aggregate tone counts — **do not** replace clustering |
| **5 — Teacher** | Additive insights on `ClusterCard` / modal: tone distribution, underlying issue, recommended action |
| **6 — Polish** | End-to-end tests, lint/build, error fallbacks |

## Design constraints (must preserve)

- Do **not** rebuild architecture, UI system, or clustering engine
- Reuse **Featherless** (existing AI utility) — do not add a second provider
- Do not auto-delete rude/abusive doubts; do not shame students
- Focus on learning intent, not moderation
- Keep `.env` / API keys out of Git

## API surface today (unchanged in Stage 1)

`POST/GET /api/sessions`, `GET .../code/:code`, `POST .../doubts`, `POST .../analyze`, `POST .../clusters/:id/addressed`, `GET .../insight`, simulation start/pause/reset.
