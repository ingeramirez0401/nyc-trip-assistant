# AGENTS.md — trippulse-app

## Skill routing (Commander) — gstack lifecycle brain

This project uses gstack. Do not wait to be told which skill to run — read the
conversation and act as dispatcher across the full lifecycle. When the user's
request matches an available skill, invoke it via the Skill tool. **When in
doubt, invoke the skill** — a wrong invocation costs one extra step; staying
silent costs a skipped review/test that ships a bug.

**Think → Plan → Build → Review → Test → Ship → Reflect**

### Phase detection (pick the latest phase that applies)

- Vague ask, new feature idea, "quiero que la app..." → **THINK**: invoke
  `/office-hours`. Skip for trivial one-line fixes/typos — go straight to BUILD.
- Idea already scoped, ready to design the approach → **PLAN**: invoke
  `/plan-eng-review` for anything touching data flow, the Express API, or
  Supabase schema/RLS. Invoke `/plan-design-review` only for UI-facing
  features. Use `/autoplan` when a feature is big enough to warrant a full
  CEO+design+eng+DX pass together.
- About to write non-trivial code with no existing plan → nudge once:
  "¿planeamos primero con /plan-eng-review o seguimos directo?"
- Just finished writing/editing code → **REVIEW**: invoke `/review` before
  saying the work is done.
- After `/review` passes and the change touches the UI or a user flow →
  **TEST**: invoke `/qa` against the local dev server (`npm run dev` — Vite
  client on :5173, Express API via `server/index.js`).
- Bug report, "no funciona", console error, 500s → invoke `/investigate`
  FIRST. Never patch blind.
- "Súbelo", "ya funciona, dale", deploy/PR request → **SHIP**: invoke `/ship`
  (or `/land-and-deploy` if it should also deploy).
- Right after a `/ship` → invoke `/document-release` if README/docs drifted
  from what shipped.
- End of a work session, or the user asks "cómo vamos"/"resumen" →
  **REFLECT**: invoke `/retro`.

### Defaults calibrated for this project

- Solo-dev, small React + Express + Supabase app — skip `/plan-ceo-review`
  and `/plan-devex-review` unless explicitly asked for a strategy/DX pass.
  `/plan-eng-review` alone is usually enough planning depth.
- Any change touching `server/`, Supabase SQL, or RLS policies → run `/cso`
  (security review) **before** `/ship`, not after.
- GBrain is configured for this project (PGLite, local, real OpenAI
  embeddings). Before starting unfamiliar work, `gbrain recall` relevant
  context. After resolving a non-obvious bug or making a real decision,
  `gbrain remember` it with `--entity project/nyc-trip-assistant` so it isn't
  re-discovered next session.
