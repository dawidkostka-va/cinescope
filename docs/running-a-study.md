# Running a study

Operational runbook for `cinescope`. Follow it verbatim; every deviation belongs in the
study card under *Incydenty*.

Reference: `metodyka.md` (version 0.2). Where this runbook and the methodology disagree,
the methodology wins and this file is wrong.

## Repository layout

| Branch | Contents | Seen by the model |
|---|---|---|
| `master` | Playwright suite, fixture, scripts, specifications, study cards | never |
| `angular-template` | Nx workspace + `apps/cinema-app` scaffold, `db.json` | yes — this is the working directory |
| `react-template` | the same for React | yes |

The template branches are cut from `master` with `apps/e2e`, `docs/` and `scripts/`
deleted. Nothing that describes how the run is scored may exist in their tree.

## 1. Before the first run of a study

1. Fill in the study card from `study-card-template.md` — question, hypothesis, variants,
   metrics, N, budget cap, environment. Do this **before** any run; it is what protects the
   study from criteria being fitted to results after the fact.
2. `pnpm sync-fixture --check` — the fixture must be identical everywhere.
3. `pnpm e2e` must report 51 criteria. A different number means the suite and the
   specification have drifted.
4. Record versions: OS, Node, pnpm, harness, Angular CLI, React, Playwright.

## 2. Preparing a run directory

```bash
git clone --single-branch --branch angular-template --depth 1 <repo> ~/runs/cinema-app
cd ~/runs/cinema-app && git remote remove origin
pnpm install
```

`--single-branch --depth 1` is not optional: it is what keeps the other branch, the suite
and the previous runs out of the model's reach. The directory is called `cinema-app` —
never anything that hints at a study, a variant or a run number.

Verify before starting: no `apps/e2e`, no `docs`, no `scripts`, no `.git/refs` beyond the
single branch.

## 3. The run

```bash
cd ~/runs/cinema-app
claude --dangerously-skip-permissions
```

or, with an enforced budget and no interaction at all:

```bash
claude -p "$(cat prompt.txt)" --dangerously-skip-permissions --max-budget-usd <limit>
```

- The prompt is Part 1 + Part 3 of the variant's specification, pasted verbatim.
- No hints, no follow-up prompts, no rescuing a failing run.
- Note the start and end timestamps, token counts, cost, and archive the transcript.

## 4. Scoring

```bash
cp -R <master checkout>/apps/e2e ~/runs/cinema-app/apps/e2e
cd ~/runs/cinema-app/apps/e2e && pnpm install && pnpm exec playwright install chromium

# one terminal
cd ~/runs/cinema-app && pnpm api            # json-server on :3000
# another
cd ~/runs/cinema-app && pnpm nx serve cinema-app   # the app on :4200

cd ~/runs/cinema-app/apps/e2e && pnpm test
node <master checkout>/scripts/score.mjs ~/runs/cinema-app/apps/e2e/results.json
```

The suite is copied **in**, after the run — never present during it.

Restore `db.json` to its frozen state before scoring: the run may have written reservations
into it.

Then run the automatic measurements the study card lists — build, lint, type-check — with
identical commands for every run, and without touching the code.

## 5. Qualification

A run qualifies when it builds **and** scores at least 41 of 51 criteria (80%).

Runs that do not qualify are excluded from the token, time and quality comparisons, but
they count towards the failure rate `X/N` and are archived like every other run.

## 6. Archiving

Per run: the exact prompt, the configuration, the full transcript, the generated code
(tagged `study-NN/variant-A/run-N`), the raw metrics, `results.json`, and the completed
card.
