# VedaAI — AI Assessment Creator

A teacher describes the assessment they want; a background worker uses Google Gemini to draft a
**structured, validated question paper** — grouped into sections, with per-question
difficulty and marks — and the result streams back to the browser in real time. The paper
can be regenerated or downloaded as a properly typeset PDF.

> The defining constraint of this build: **raw LLM output is never rendered or stored.**
> Claude is treated as a structured-data generator, and its output crosses a hard Zod
> validation boundary before it becomes an `Assignment`.

---

## Architecture

```
┌──────────────┐   POST /assignments    ┌──────────────┐   add job    ┌─────────────┐
│              │ ─────────────────────► │              │ ───────────► │   BullMQ    │
│   Next.js    │   (202 + assignmentId) │  Express API │  (Redis)     │   (Redis)   │
│  (web app)   │ ◄───────────────────── │              │              └──────┬──────┘
│              │                        │              │                     │ consumes
│  Zustand +   │      WebSocket         │  Socket.IO   │                     ▼
│  socket.io   │ ◄════ progress ═══════ │  QueueEvents │              ┌─────────────┐
└──────────────┘                        └──────┬───────┘              │   Worker    │
                                               │ reads/writes         │             │
                                               ▼                      │ Claude →    │
                                        ┌──────────────┐  writes      │  Zod →      │
                                        │   MongoDB    │ ◄─────────── │  reconcile  │
                                        │ (assignments)│              │ + Puppeteer │
                                        └──────────────┘              └─────────────┘
```

**Flow:** API request → job queued → worker generates & validates → result stored in Mongo →
worker reports progress via `job.updateProgress` → API's `QueueEvents` forwards it to the
assignment's Socket.IO room → frontend updates live and refetches the finished paper.

The HTTP request that creates an assignment **returns immediately** with a job id; it never
blocks on the model. Everything slow happens in the worker.

### Why this shape

- **Decoupled worker.** Generation and PDF rendering are background jobs, so the API stays
  responsive and the work is retryable. The worker can scale independently.
- **`QueueEvents` as the bridge.** The worker only knows BullMQ; the API observes job
  lifecycle and owns the websocket layer. They communicate purely through Redis. The
  `assignmentId` is used as the BullMQ `jobId`, so a job maps cleanly to a socket room.
- **Two job types, two queues.** `assessment-generation` and `pdf-generation` are separate,
  matching the brief's "generation, PDF" background jobs.

---

## The AI layer (the important part)

`apps/worker/src/ai/`

1. **Structured prompt** (`prompt.ts`) — the validated input becomes an explicit system +
   user prompt: required sections, difficulty spread, marks that must sum exactly, MCQ
   option rules, and optional source material from an uploaded file.
2. **Schema-forced JSON** (`generate.ts`) — Gemini is called with
   `responseMimeType: "application/json"` and a `responseSchema` **generated from
   the same Zod schema** the runtime validates against (`zod-to-json-schema`).
   The model is constrained to emit JSON in that shape; there is no prose to parse.
3. **Validation boundary** — the tool input is re-parsed with `QuestionPaperSchema`. If it
   fails, a **single repair attempt** feeds the Zod errors back to the model. If that also
   fails, the job throws and BullMQ retries.
4. **Deterministic reconciliation** — `totalMarks` is recomputed from the actual questions
   rather than trusting the model's arithmetic.

Because the LLM contract and the runtime contract are derived from one schema, they cannot
silently drift apart.

---

## Tech stack

| Layer     | Choice |
|-----------|--------|
| Frontend  | Next.js 14 (App Router) · TypeScript · **Zustand** · socket.io-client · react-hook-form + Zod · Tailwind |
| Backend   | Node.js · Express · TypeScript · Mongoose (MongoDB) · ioredis · **BullMQ** · Socket.IO |
| AI        | Google Gemini (`@google/genai`), schema-forced JSON structured output |
| PDF       | Puppeteer (HTML template → typeset A4 PDF) |
| Shared    | A `@veda/shared` package of Zod schemas + event types, the single source of truth |

---

## Project structure

```
veda-ai-assessment/
├── docker-compose.yml          # MongoDB + Redis
├── packages/shared/            # Zod schemas + WS event contracts (used everywhere)
└── apps/
    ├── api/                    # Express: routes, queue producer, Socket.IO, QueueEvents
    ├── worker/                 # BullMQ consumers: AI generation + PDF rendering
    └── web/                    # Next.js: dashboard list, create form, output paper
        └── src/app/            #   / (dashboard) · /create · /assignments · /papers/[id]
```

---

## Setup

### Prerequisites
- Node.js 20+
- Docker (for MongoDB + Redis), or your own local instances
- A Google Gemini API key (free, no credit card — https://aistudio.google.com/apikey)
- Puppeteer downloads a Chromium build on install. On Linux you may need system libraries
  (`libnss3`, `libatk-bridge2.0-0`, `libgbm1`, `libasound2`, …). PDF rendering is the only
  feature that needs it; the rest of the app runs fine without.

### 1. Install
```bash
npm install
```

### 2. Environment
```bash
cp .env.example .env                       # fill in GEMINI_API_KEY
cp apps/web/.env.local.example apps/web/.env.local
```
The API and worker read the root `.env`; load it however you prefer (e.g. `node --env-file`,
`dotenv`, or your shell). All variables are documented in `.env.example`.

### 3. Start infrastructure
```bash
npm run infra:up        # docker compose up -d  (mongo + redis)
```

### 4. Run everything
```bash
npm run dev             # api (:4000) + worker + web (:3000) together
```
Open http://localhost:3000.

You can also run pieces individually: `npm run dev:api`, `npm run dev:worker`, `npm run dev:web`.

---

## API reference

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/api/health` | Liveness check |
| `POST` | `/api/assignments` | Create assignment. `multipart/form-data`: `payload` (JSON of the input) + optional `file` (PDF/text). Returns `202 { assignmentId }`. |
| `GET`  | `/api/assignments/:id` | Fetch the assignment (status + paper once ready). |
| `POST` | `/api/assignments/:id/regenerate` | Re-run generation for the same input. |
| `GET`  | `/api/assignments/:id/pdf` | Enqueue a PDF render job, wait for it, stream the PDF. `409` if the paper isn't ready. |

WebSocket: client emits `assignment:subscribe` with an id; server emits `assignment:progress`
(`{ status, progress, message, error? }`) to that room.

---

## Bonus features implemented

- **PDF export** via Puppeteer — a real typeset A4 paper, not a browser print of the DOM.
- **Regenerate** action on the output page.
- **Difficulty badges** — colour-coded Easy / Moderate / Hard tags on every question.
- **Redis content cache** — generation results are cached by a hash of the input
  (`apps/worker/src/lib/cache.ts`), so identical requests (or a no-change regenerate) skip
  the model entirely.

---

## Validation

Validation happens on both sides of the wire from one schema:
- **Client** — react-hook-form + Zod block empty fields, past due-dates, and non-positive
  counts/marks before submit.
- **Server** — the same `AssignmentInputSchema` re-validates the request; the worker validates
  the model's output against `QuestionPaperSchema`.

---

## Production notes & known limitations

- **Dev-first module resolution.** `@veda/shared` is consumed as TypeScript source (smooth
  `npm run dev` via `tsx` and Next `transpilePackages`). For a compiled production deploy,
  point the package's `exports`/`main` at a built `dist/` (or run the services with `tsx`).
- **PDF storage.** The worker writes PDFs to a shared `.data/pdfs` directory that the API
  streams from — fine for a single host / dev. In production use object storage (S3) or
  GridFS instead of a shared filesystem path.
- **Auth.** There's no teacher auth in this scaffold; assignments are addressable by id.
- **Env loading.** Wire your preferred dotenv strategy into the API/worker entrypoints for a
  one-command boot.
```
