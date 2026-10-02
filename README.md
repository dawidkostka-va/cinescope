# Cinescope

A web application for booking cinema seats: pick a day and a screening, choose seats on the
auditorium map, review the tickets, fill in the customer details and pay.

## Layout

```
spec/
  README.md    the specification
  tickets/     the work split into tickets with acceptance criteria
db.json        the backend data, served by `pnpm api`
```

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | installs dependencies |
| `pnpm api` | starts `json-server` at `http://localhost:3000`, serving `db.json` |
| `pnpm lint` | ESLint of every project |
| `pnpm format` | Prettier |

Requirements: Node 26.5 (`.nvmrc`) and pnpm 11.1.
