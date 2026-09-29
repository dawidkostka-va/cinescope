# cinescope

Harness for measuring how AI coding agents build the same web application in Angular and
in React — token usage first, then build success, feature completeness and code quality.
The method is `docs/metodyka.md`; this study's design is `docs/study-design.md`; the
step-by-step procedure is `docs/running-a-study.md`.

The agent gets one prompt and a branch of this workspace that holds only its own app. It
never sees the suite, the other app, the specification sources or the study documents.

## Layout

```
apps/
  cinescope-angular/  Nx Angular app (Angular Material) — agent workspace for variant A
  cinescope-react/    Nx React app (MUI) — agent workspace for variant B
  e2e/                Playwright suite, one test per acceptance criterion (69)
    src/routes/<route>/<route>.spec.ts   tests of one route
    src/routes/<route>/<route>.utils.ts  helpers of that route
    src/utils/        shared helpers (selectors, form fields, network, clock, …)
    src/mocks/        fixture copy (checked against db.json before every run), texts, customer data, auditorium constants
    src/types/        shared types
spec/                 the specification the agent reads
  README.md           the specification, shared by both variants
  stack/<variant>.md  the one paragraph that differs between variants (app name, stack, UI library)
  tickets/            vertical-slice tickets
prompts/<variant>.txt the exact prompt per variant
db.json               the frozen backend fixture, served by `pnpm api`
docs/                 methodology, study design, runbook, study cards
```

## Commands

| Command | What it does |
|---|---|
| `pnpm api` | `json-server` on :3000 serving `db.json` |
| `pnpm nx serve cinescope-angular` / `cinescope-react` | the app on :4200 |
| `pnpm nx build\|test\|lint <app>` | build, Vitest, ESLint of one app |
| `pnpm e2e` | the Playwright suite against whatever serves :4200 and :3000 |
| `pnpm lint` | ESLint of every project |

Requirements: Node 26.5 (`.nvmrc`), pnpm 11.1, Chromium for Playwright
(`pnpm exec playwright install chromium`).

## Changing the specification

1. Edit `spec/` (and `apps/e2e` if a criterion changes). If `db.json` changes, make the
   same change to `apps/e2e/src/mocks/db.json`; the suite refuses to run while they differ.
2. Bump the version and add a changelog entry in `docs/study-design.md`.
3. Runs made before the change belong to a different series.

## Preparing the agent branches

Each variant's branch holds the workspace with only its own app: delete the other app, the
other variant's `spec/stack/` file, `apps/e2e`, `docs/`, `prompts/` and this README, drop
the `e2e` script and the other framework's dependencies, then rename the app (for example
`cinescope-angular` → `cinescope`) in its folder, `project.json` or Vite config, stack file
and prompt. See `docs/running-a-study.md`.
