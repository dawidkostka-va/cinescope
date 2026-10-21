# Badanie 1: Czy framework wpływa na to, ile funkcjonalności ze specyfikacji działa w aplikacji stworzonej przez AI?

<!-- Wymagania: tytuł to pytanie albo teza w jednym zdaniu, zrozumiała bez czytania karty. NN to kolejny numer badania. -->

## Metadane

<!-- Wymagania: wypełnione przed pierwszym runem. -->

- Data: 2026-10-5
- Prowadzący: Dawid Kostka, Mateusz Zatoń
- Wersja metodyki: 0.3

## Pytanie badawcze

<!-- Wymagania: jedno zdanie. Musi dać się odpowiedzieć liczbami z sekcji Rezultat po wykonaniu runów. -->

Czy framework wpływa na to, ile funkcjonalności ze specyfikacji działa w aplikacji stworzonej przez AI?

## Hipoteza

<!-- Wymagania: co spodziewamy się zobaczyć i w której kategorii wyniku (funkcjonalność, jakość techniczna, efektywność AI). Zapisana przed pierwszym runem, nie zmieniamy jej po wynikach. -->

Nie, framework nie wpływa na to, ile funkcjonalności ze specyfikacji działa w aplikacji stworzonej przez AI. Modele takie jak Sonnet są wystarczająco inteligentne, aby stworzyć aplikację w obu frameworkach.

## Ograniczenia badania

<!-- Wymagania: co może zaburzyć wynik i czego nie kontrolujemy — znane przed startem (np. timeout checków na obciążonej maszynie liczy się jako FAIL; czas zależy od obciążenia API). Ograniczenia odkryte w trakcie dopisujemy z datą, nie usuwamy wcześniejszych. -->

…

## Warianty

<!-- Wymagania: warianty różnią się dokładnie jedną rzeczą (model, harness albo zadanie). -->
<!-- Harness: każdy wariant to profil w config.json → profiles.<profil> (repository, branch). Harness bierze tip brancha przy każdym runie i zapisuje go w manifest.json → commit; w trakcie badania nikt nie dodaje commitów do brancha. -->

| Profil      | Repozytorium + branch                                             | Różnica                                                                                                                    |
| ----------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `control`   | https://github.com/dawidkostka-va/cinescope/tree/template/angular | Template aplikacji Angular + Nx. Zawiera bibliotekę UI @angular/material oraz opis stacku w pliku spec/stack.md     |
| `treatment` | https://github.com/dawidkostka-va/cinescope/tree/template/react   | Template aplikacji React + Nx. Zawiera bibliotekę UI @mui/material oraz opis stacku aplikacji w pliku spec/stack.md |

## Konfiguracja

<!-- Wymagania: opisuje środowisko wirtualne, w którym idą runy — tyle, żeby ktoś z zewnątrz odtworzył badanie. Najpierw ustalamy wartości tutaj, potem ustawiamy je w harnessie (miejsce w komentarzu nad każdym polem). -->
<!-- Harness: config.json → claude.model. Pełne ID modelu (np. claude-sonnet-5-5), nie alias (sonnet, opus); faktyczny model potwierdzamy po runie z verdict.json → cost.byModel. -->

- Model (pełne ID): claude-sonnet-5

<!-- Harness: docker/docker-entrypoint.sh → argumenty wywołania claude -->

- Effort i inne tryby: effort high, thinking adaptive

<!-- Harness: docker/Dockerfile → ARG CLAUDE_CODE_VERSION -->

- Wersja Claude Code: 2.1.278

<!-- Harness: repo projektu, branch profilu (config.json → profiles.<profil>.branch), katalog .claude/skills -->

- Skille: brak
  <!-- Harness: docker/docker-entrypoint.sh → --disallowedTools 'mcp__*' (domyślnie MCP wyłączone) -->
- MCP: brak
- Środowisko:
    <!-- Harness: docker/Dockerfile → FROM node:… -->
  - OS + Node.js: docker node:26.5.0-bookworm-slim
  <!-- Harness: docker/Dockerfile → ARG PACKAGE_MANAGER_VERSION -->
  - pnpm: 11.1.0
  <!-- Harness: docker/Dockerfile → ARG ANGULAR_CLI_VERSION -->
  - Angular CLI: 22
  <!-- Harness: config.json → resources.cpus, resources.memory -->
  - Limity CPU i RAM: 4 CPU, 8 GB RAM
  <!-- Harness: brak pola; tyle razy uruchamiamy start-experiment.sh na profil. Ustalone przed startem, nie po zobaczeniu wyników. -->
- Planowana liczba runów na wariant: 15

<!-- Harness: brak pola. Minimum 10 runów VALID. -->

- Minimalna liczba runów `VALID` na wariant do publikacji: 10

<!-- Harness: config.json → claude.maxBudgetUsd -->

- Limit budżetu na run w USD: nieograniczony

<!-- Harness: brak pola; próg stosuje grader (osobny skrypt, w przygotowaniu), classify-run.sh go nie zna. Inną wartość niż domyślna uzasadniamy przed startem. -->

- Próg zaliczonych testów e2e (passed/total): brak progu z racji badania funkcjonalności aplikacji

<!-- Harness: config.json → validationTimeoutMinutes -->

- Limit czasu checków (min): 15

## Prompt

<!-- Wymagania: dokładny tekst. Prompt nie może zawierać słów „badanie”, „test”, „porównanie”, „wariant” ani informacji o ocenie kodu. Nie może podpowiadać rozwiązania ani odsyłać do testów oceniających. Prompty wariantów różnią się tylko tym, co wynika z badanej zmiennej. -->
<!-- Harness: config.json → profiles.<profil>.prompt -->

| Profil      | Prompt                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control`   | Build the cinema seat-booking web application described in spec/README.md, as the Angular application already set up in this Nx workspace (Nx project `cinescope` in apps/cinescope); its stack is described in spec/stack.md. The work is split into tickets in spec/tickets/; implement them in order. spec/README.md is the complete specification: do not ask any questions, and where it is silent choose the simplest option that satisfies it. Finish only when every ticket is done and `pnpm nx build cinescope` succeeds. |
| `treatment` | Build the cinema seat-booking web application described in spec/README.md, as the React application already set up in this Nx workspace (Nx project `cinescope` in apps/cinescope); its stack is described in spec/stack.md. The work is split into tickets in spec/tickets/; implement them in order. spec/README.md is the complete specification: do not ask any questions, and where it is silent choose the simplest option that satisfies it. Finish only when every ticket is done and `pnpm nx build cinescope` succeeds.   |

## Definicja automatycznej punktacji (zamrożona przed pierwszym runem)

<!-- Wymagania: wszystko liczy skrypt, bez ręcznej punktacji. Każda podmetryka ma punkty i regułę ich przyznawania; punkty podmetryk sumują się do maksimum kategorii. Po starcie nie zmieniamy niczego bez wpisu w Incydentach i ponownego przeliczenia wszystkich runów. -->
<!-- Do uzupełnienia później: skrypty, testy, skille i ich wersje; ustawienia modelu oceniającego, jeśli jest używany. -->
<!-- Do uzupełnienia później: obsługa brakujących danych, błędów skryptu i wyników niejednoznacznych (np. check unavailable, setup_failed). -->

**Definicja typów runów**

<!-- Harness: verdict nadaje scripts/classify-run.sh (wersja: CLASSIFIER_VERSION); FAIL za e2e poniżej progu nadaje grader. -->

- `INVALID`: `secret_leak`, `no_result_event`, `turn_limit`, `agent_error`, `capture_failed`, `validation_missing`.
- `FAIL`: `no_changes`, wymagany check `fail` / `timeout` / `setup_failed`, e2e poniżej progu z sekcji Konfiguracja.
- `PASS`: pozostałe.

**Punktacja**

<!-- Harness: checki w config.json → validation.<check>; punkty liczy grader (osobny skrypt, w przygotowaniu) z verdict.json. Jednostki score: build, typecheck — check (0/1); lint — pliki; e2e — testy. -->
<!-- Źródła danych w verdict.json: build → scores.build; e2e → scores.e2e (passed/total); typecheck → scores.typecheck, errors; lint → scores.lint, errors, warnings; koszt → cost.totalUsd; czas → session.durationMs, czas API → session.apiDurationMs; tokeny → cost.tokens.input, output, cacheRead, cacheWrite; tury → session.numTurns -->
<!-- Tokeny i tury nie mają punktów (koszt już je zawiera). Waga czasu mała i uzasadniona w regule (czas zależy od obciążenia API). -->
<!-- Check oparty o skill (np. architektura) — jeszcze nie ma takiego w harnessie. Gdy powstanie: dodatkowy check w config.json → validation.<nazwa> (score 0/1 z exit code), wiersz w tej tabeli i kolumna w Rezultacie; dla skilla z modelem zapisujemy wersję, instrukcję, model, ustawienia i surowy wynik. -->

| Kategoria      | Maks. | Podmetryka | Punkty | Reguła punktów                                                                          |
| -------------- | ----- | ---------- | ------ | --------------------------------------------------------------------------------------- |
| Funkcjonalność | 100   | build      | 10     | 10 pkt, gdy build przejdzie                                                             |
|                |       | e2e        | 90     | przyznawane na podstawie % testów, które przeszły, zaokrąglone w dół do pełnych punktów |

## Rezultat po wykonaniu runów

<!-- Wymagania: dwa wiersze na każdy run, także INVALID i FAIL: pierwszy z surowymi danymi, drugi z punktami kategorii. Surowe dane przepisujemy z verdict.json / runs/summary.csv (scripts/compare-runs.sh); punkty, mediany i min/max liczy grader (osobny skrypt, w przygotowaniu), nie arkusz ręczny. Wiersze w kolejności uruchomień (RUN_ID = <profil>-<czas UTC>). Kolumny checków zawierają score (passed/total). Verdict z powodem w nawiasie, np. FAIL (budget_exceeded); PASS bez nawiasu. Wynik: suma punktów, pod nią F (funkcjonalność), T (jakość techniczna), AI (efektywność AI). Run FAIL: tylko wynik funkcjonalności; jakość techniczna, efektywność AI i wynik końcowy to —. Branch runu: agent-runs/<RUN_ID> (config.json → git.branchPrefix). -->

<table>
  <thead>
    <tr>
      <th rowspan="2">RUN_ID</th>
      <th rowspan="2">Profil</th>
      <th rowspan="2">Verdict (powód)</th>
      <th rowspan="2">Wynik</th>
      <th colspan="2">Funkcjonalność</th>
    </tr>
    <tr>
      <th>build</th>
      <th>e2e</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="2">…</td>
      <td rowspan="2">…</td>
      <td rowspan="2">… (…)</td>
      <td rowspan="2">… pkt<br>(F: …)</td>
      <td>…</td>
      <td>…</td>
    </tr>
    <tr>
      <td colspan="2">Funkcjonalność: …/…</td>
    </tr>
  </tbody>
</table>

**Legenda kolumny Wynik:** F — punkty funkcjonalności. Liczba nad nimi to suma (wynik /100).

**Podsumowanie per profil** (tylko runy `VALID`)

<!-- Format komórki: każda wartość w osobnej linii (<br>): rezultat Med, Min, Max (tylko gdy statystyka ma surowy rezultat; Min i Max tylko gdy da się je wyliczyć, np. build, typecheck: sam % runów VALID, które przeszły). Ostatnia linia — Med: … Pkt, mediana punktów za podmetrykę (brak, gdy podmetryka nie jest punktowana, np. tury). Procenty: e2e / lint — % zaliczonych testów / plików w runie; koszt — % limitu budżetu. Czas, czas API, tokeny i tury w jednostkach surowych; tokeny i tury bez punktów. Jakość techniczna, efektywność AI i wynik /100 liczymy tylko z runów PASS (run FAIL nie ma tych wyników). -->

| Statystyka                 | `control`                                | `treatment`                              |
| -------------------------- | ---------------------------------------- | ---------------------------------------- |
| **Funkcjonalność**         |                                          |                                          |
| build przechodzi (% runów) | …<br>Med: … Pkt                          | …<br>Med: … Pkt                          |
| zaliczone testy e2e (%)    | Med: …<br>Min: …<br>Max: …<br>Med: … Pkt | Med: …<br>Min: …<br>Max: …<br>Med: … Pkt |
| punkty                     | Med: … Pkt                               | Med: … Pkt                               |

## Wskaźnik porażek

<!-- Wymagania: INVALID nie wlicza się do mianownika. Każdy powód FAIL liczymy osobno (run może mieć kilka). -->

| Profil      | Wszystkie runy | `INVALID` | `VALID` | `PASS` | `FAIL` | % `FAIL` wśród `VALID` | Powody `FAIL` (powód × liczba) |
| ----------- | -------------- | --------- | ------- | ------ | ------ | ---------------------- | ------------------------------ |
| `control`   | …              | …         | …       | …      | …      | …                      | …                              |
| `treatment` | …              | …         | …       | …      | …      | …                      | …                              |

## Incydenty

<!-- Wymagania: każdy run INVALID z przyczyną, każda zmiana reguł po starcie, nieudany push brancha runu, niekompletny capture, błędy API. Typ: INVALID, zmiana reguł, push, capture albo inne. RUN_ID powtórki wpisujemy w opisie. -->

| Data | RUN_ID | Profil | Typ | Opis |
| ---- | ------ | ------ | --- | ---- |
| …    | …      | …      | …   | …    |

## Wnioski

<!-- Wymagania: odpowiedź na pytanie badawcze i weryfikacja hipotezy, oparte tylko na sekcji Rezultat po wykonaniu runów. Bez twierdzeń o istotności statystycznej, jeśli nie było takiej analizy. -->

…

## Poprawki do metodyki na przyszłość

<!-- Wymagania: konkretna zmiana w metodyka.md (sekcja + propozycja). Po wprowadzeniu podbijamy wersję metodyki. -->

…
