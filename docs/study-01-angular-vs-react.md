# Badanie 01: Angular vs React — rezerwacja miejsc w kinie

## Metadane
- Data: 2026-09-24 (projekt), przebiegi: <uzupełnić>
- Prowadzący: Dawid Kostka
- Wersja metodyki: 0.2

## Pytanie badawcze
Czy agent (Claude Code) zużywa istotnie inną liczbę tokenów, budując tę samą aplikację wg tej samej specyfikacji w Angularze i w React?

## Hipoteza
<uzupełnić przed pierwszym przebiegiem>

## Warianty
| Wariant | Różnica |
|---|---|
| A | Angular 22 + Angular Material (Nx) — `apps/cinescope-angular`, `prompts/angular.txt` |
| B | React 19 + MUI (Nx, Vite) — `apps/cinescope-react`, `prompts/react.txt` |

Specyfikacja, tickety, kryteria i `db.json` identyczne (patrz `study-design.md`, sekcja 1).

## Konfiguracja
- Model:
- Harness + wersja:
- Ustawienia (skille, MCP, tryby):
- Środowisko: OS / Node / Angular CLI / inne:
- Tryb badania (pilotażowy / publikacyjny): pilotażowy
- Liczba przebiegów na wariant: 3 (pilotaż)
- Próg kwalifikacji przebiegu: `pnpm nx build <app>` OK + ≥ 56/69 kryteriów (80%)
- Limit budżetu na przebieg (realnie egzekwowany, USD):
- Dokładna komenda uruchomienia (verbatim, per przebieg): `claude -p "$(cat prompts/<wariant>.txt)" --dangerously-skip-permissions --max-budget-usd <limit>`
- Izolacja kontekstu: branch wariantu sklonowany `--single-branch --depth 1`, remote usunięty, katalog `cinescope` (brak suite/metodyki/promptu/drugiej aplikacji):
- Limit sesji (tury):

## Prompt (dokładny tekst)
Wariant A (`prompts/angular.txt`); wariant B różni się wyłącznie nazwą aplikacji i słowem `React` (nazwę aplikacji zmieniamy na branchu, np. na `cinescope`):

> Build the cinema seat-booking web application described in spec/README.md, as the Angular application apps/cinescope-angular already set up in this Nx workspace; its stack is described in spec/stack/angular.md. The work is split into tickets in spec/tickets/; implement them in order. spec/README.md is the complete specification: do not ask any questions, and where it is silent choose the simplest option that satisfies it. Finish only when every ticket is done and `pnpm nx build cinescope-angular` succeeds.

## Skrypt odpowiedzi na ewentualne pytania modelu
Brak odpowiedzi — przebieg non-interactive (`-p`). Prompt i specyfikacja zabraniają pytań.

## Metryki i kryteria oceny (przed startem!)
- [ ] tokeny in/out/cache
- [ ] koszt
- [ ] czas
- [ ] build (tak/nie)
- [ ] testy: suite `apps/e2e`, 69 kryteriów (AC-01…AC-69), `pnpm e2e`
- [ ] lint
- [ ] feature'y działające / wymagane (lista poniżej)
- [ ] wskaźnik porażek (X/N przebiegów niekwalifikowanych)
- [ ] checklista jakości 0–10 (sekcja 3.2 metodyki)

## Wyniki
| Przebieg | Wariant | Komenda uruchomienia | Tokeny in | Tokeny out | Koszt | Czas | Build | Feature'y (x/y) | Kwalifikowany (T/N) | Testy | Lint | Jakość (0–10) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

## Wskaźnik porażek
| Wariant | Przebiegi niekwalifikowane / N | Powody |
|---|---|---|
| A | | |
| B | | |

## Incydenty (odrzucone przebiegi, błędy API itd.)


## Wnioski


## Ograniczenia badania


## Poprawki do metodyki na przyszłość
