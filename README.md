# Cinescope

A web application for booking cinema seats: pick a day and a screening, choose seats on the
auditorium map, review the tickets, fill in the customer details and pay.

## Layout

```
apps/
  cinescope/   the application (Nx project `cinescope`)
spec/
  README.md    the specification
  stack.md     the framework, libraries and state of the scaffold
  tickets/     the work split into tickets with acceptance criteria
db.json        the backend data, served by `pnpm api`
```

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | installs dependencies |
| `pnpm api` | starts `json-server` at `http://localhost:3000`, serving `db.json` |
| `pnpm nx serve cinescope` | starts the application at `http://localhost:4200` |
| `pnpm nx build cinescope` | production build |
| `pnpm nx test cinescope` | unit tests (Vitest) |
| `pnpm nx lint cinescope` | ESLint |
| `pnpm lint` | ESLint of every project |
| `pnpm format` | Prettier |

Requirements: Node 26.5 (`.nvmrc`) and pnpm 11.1.
