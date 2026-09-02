# Metodyka badań LLM-ów pod kątem Angulara

**Wersja:** 0.2
**Data:** 2026-08-21
**Autorzy:** Grzegorz Lipke, Krzysiek, Dawid Kostka

---

## 1. Cel badań

1. Zdobyć praktyczną wiedzę o tym, jak LLM-y radzą sobie z kodem Angularowym (co warto / czego nie warto używać).
2. Tworzyć content dla community: artykuły, zestawienia, infografiki, shorty.
3. Budować wizerunek zespołu, który realnie bada temat AI + Angular i/lub frontend.

Metodyka ma sprawić, że wyniki będą **miarodajne, powtarzalne i transparentne** — każdy, kto zakwestionuje wynik, może odtworzyć badanie krok po kroku.

---

## 2. Zasady ogólne (obowiązują w każdym badaniu)

### 2.1. Czysty kontekst
- Każdy przebieg badania startuje w **nowej sesji**, bez pamięci o poprzednich rozmowach.
- Wyłączamy / czyścimy wszystkie mechanizmy pamięci trwałej (memory, historia projektu, `CLAUDE.md` użytkownika, custom instructions), chyba że są **częścią badanego wariantu** — wtedy jawnie to opisujemy.
- Katalog roboczy jest świeży (pusty lub czysty klon repozytorium na ustalonym commicie).
- **Model nie widzi innych branchy ani historii projektu.** Klonujemy pojedynczy branch bez pełnej historii i odcinamy remote:

  ```
  git clone --single-branch --branch <branch> --depth 1 <repo> <katalog-przebiegu>
  cd <katalog-przebiegu> && git remote remove origin
  ```

  Powód: przy dostępie do innych branchy model może podejrzeć rozwiązanie z wcześniejszego przebiegu lub z brancha referencyjnego i wynik przestaje mierzyć jego własną pracę. Dla zadań generowanych od zera (typ 1–3) katalog jest po prostu pusty, bez repozytorium.
- **Model nie może wiedzieć, że jest testowany.** Świadomość bycia ocenianym zmienia zachowanie modelu (ostrożniejszy kod, dopisywanie komentarzy pod recenzenta, tłumaczenie się w odpowiedzi) i skaża wynik. Praktycznie:
  - nazwy katalogu roboczego i brancha są neutralne (`shop-app`, nie `badanie-03-wariant-b-run-2`),
  - w katalogu roboczym nie ma metodyki, karty badania, checklisty oceny, testów akceptacyjnych ani wyników poprzednich przebiegów,
  - prompt nie zawiera słów "badanie", "test", "porównanie", "wariant" ani informacji, że kod będzie oceniany,
  - artefakty badania (transcript, karta, metryki, tagi `badanie-01/wariant-a/run-1`) trzymamy poza katalogiem roboczym, w osobnym repo badania.

### 2.2. Izolowane środowisko
- Badania odpalamy na **jednej, opisanej maszynie** (lub maszynie zdalnej / VM o stałej konfiguracji).
- Spisujemy: OS + wersja, wersja Node.js, wersja menedżera pakietów, wersja harnessu (np. Claude Code X.Y.Z), wersje CLI frameworków (Angular CLI itd.).
- Żadnych innych procesów mocno obciążających maszynę w trakcie pomiarów czasu.
- **Zakaz równoległych sesji z jednego konta** — przebiegi odpalamy sekwencyjnie. Równoległość dopuszczalna wyłącznie na osobnych kontach / kluczach API i musi być odnotowana w karcie badania.
- Sieć: jeśli mierzymy czas, uruchamiamy badania o zbliżonej porze i zaznaczamy, że czas generacji zależy też od obciążenia API po stronie dostawcy (dlatego czas raportujemy jako metrykę **pomocniczą**, nie główną).

### 2.3. Izolacja modelu od harnessu
- Rozdzielamy dwie warstwy: **model** (np. Claude Sonnet 5, Claude Opus 5) i **harness/narzędzie** (np. Claude Code, wywołanie przez API, inne agenty).
- W jednym badaniu zmieniamy **tylko jedną zmienną**: albo model (ten sam harness), albo harness (ten sam model), albo wariant zadania (ten sam model i harness).
- W raporcie zawsze podajemy pełną parę: `model + wersja harnessu + ustawienia` (temperatura/effort jeśli dostępne, włączone skille, MCP, itd.).

### 2.4. Porównywalne case'y
- Zadania projektujemy tak, żeby warianty różniły się **dokładnie jednym elementem** (framework, biblioteka, skill, model).
- Prompt wejściowy jest **identyczny co do znaku** między wariantami (poza niezbędną różnicą, np. nazwą frameworka) i jest wersjonowany w repo badania.
- Specyfikacja zadania jest na tyle precyzyjna, żeby "kreatywność" modelu nie rozjeżdżała zakresu (lista wymaganych feature'ów, ekranów, zachowań).

### 2.5. Powtarzalność — dwa tryby badań
- **Tryb pilotażowy** (kalibracja metodyki): N ≥ 3 na wariant. Nie publikujemy z niego wniosków liczbowych — służy do sprawdzenia, czy protokół i metryki działają.
- **Tryb publikacyjny:** N ≥ 10 na wariant, docelowo 20–30. Pilotaż potwierdza potrzebę: wariant "bez skilli" miał rozrzut 90,6k–175,6k tokenów (max/min ≈ 1,9×), czyli przy N=3 mediana jest niestabilna.
- W trybie publikacyjnym N dobieramy tak, żeby po odsiewie pozostało **≥ 10 przebiegów kwalifikowanych** na wariant (definicja: Faza B/C).
- Każdy scenariusz uruchamiamy na identycznych danych wejściowych.
- Raportujemy: wszystkie wyniki jednostkowe + medianę (główna wartość) + min/max (rozrzut). Przy N=3 nie liczymy odchylenia standardowego na poważnie — pokazujemy rozrzut.
- Jeśli rozrzut jest duży (np. max/min > 2×), zwiększamy N do 5 albo opisujemy niestabilność jako wynik sam w sobie.
- Przebieg "zepsuty" z przyczyn zewnętrznych (błąd API, brak internetu, limit) odrzucamy i powtarzamy, ale **odnotowujemy** to w logu badania.

### 2.6. Ocena wyników — na start ręcznie
- Wyniki oceniamy **ręcznie**, według checklisty ustalonej **przed** badaniem (sekcja 4).
- **Ocenia jedna osoba.** Druga osoba ocenia tylko wyrywkowo (np. 1 przebieg na wariant) oraz wtedy, gdy wynik jest kontrowersyjny — pełna podwójna ocena wszystkich przebiegów jest nieopłacalna przy N ≥ 10.
- Automat skanujący przestarzały syntax (narzędzie Dawida) formalizujemy jako **oficjalne narzędzie** do kryterium "Nowoczesny Angular": wersjonowany w repo badania, ta sama wersja narzędzia dla wszystkich wariantów.
- Świadomie NIE używamy LLM-a jako sędziego na tym etapie — podwójne użycie LLM mogłoby zakrzywiać wyniki. Docelowo LLM-judge, kalibrowany na dotychczasowych ocenach ręcznych.
- Tam, gdzie się da, preferujemy kryteria **binarne / mierzalne** (builduje się: tak/nie; testy przechodzą: X/Y; lint errors: liczba), a nie uznaniowe.

### 2.7. Transparentność i archiwizacja
Dla każdego przebiegu archiwizujemy:
- prompt wejściowy (dokładny tekst),
- konfigurację (model, harness, wersje, ustawienia, włączone skille/MCP),
- pełny transcript sesji (jeśli narzędzie pozwala),
- wygenerowany kod (osobne repo/branch/tag per przebieg, np. `badanie-01/wariant-a/run-1`),
- surowe metryki (tokeny, czas, koszt),
- wypełnioną kartę oceny.

Publikując wyniki, publikujemy też metodykę i (tam gdzie można) repozytoria z kodem — to jest nasza odpowiedź na "maruderów".

---

## 3. Metryki

### 3.1. Metryki główne (twarde, automatyczne)
| Metryka | Jak mierzymy | Uwagi |
|---|---|---|
| Tokeny wejściowe / wyjściowe | Odczyt z harnessu (np. `/cost` w Claude Code) lub z API usage | Rozbijamy na input/output/cache, bo cache mocno zmienia koszt |
| Koszt ($) | Wyliczenie z tokenów × cennik na dzień badania | Zapisujemy cennik użyty do wyliczeń |
| Czas generacji (wall-clock) | Timestamp startu i końca sesji | Metryka pomocnicza — zależy od obciążenia API |
| Liczba tur / wywołań narzędzi | Z transcriptu | Pokazuje "ile pracy" model potrzebował |
| Build: sukces/porażka | `ng build` (lub odpowiednik) na wygenerowanym kodzie | Zero ingerencji w kod przed buildem |
| Testy: X/Y przechodzi | Z góry przygotowany zestaw testów akceptacyjnych (jeśli badanie go przewiduje) | Testy pisze człowiek PRZED badaniem |
| Lint / kompilacja TS | `ng lint`, `tsc --noEmit` — liczba błędów/warningów | Stała konfiguracja lintera dla wszystkich wariantów |
| Rozmiar bundle | `ng build` + odczyt rozmiaru | Tylko przy badaniach performance |
| Zgodność ze specyfikacją: feature'y działające / wymagane | Ręczne przejście listy wymagań z Fazy A | Metryka główna, poza checklistą 0–2; lista wymagań zamrożona przed startem |
| Wskaźnik porażek: X/N przebiegów bez akceptowalnego rezultatu | Zliczenie przebiegów niekwalifikowanych na wariant | To wynik sam w sobie, nie szum — raportujemy zawsze |

### 3.2. Metryki jakości kodu (ręczna checklista, skala 0–2)
Oceniane przez człowieka wg checklisty (0 = nie spełnia, 1 = częściowo, 2 = spełnia). **Zgodność ze specyfikacją NIE jest tu punktowana** — jest osobną metryką główną (sekcja 3.1). Maksimum: **10 pkt** (5 kryteriów × 2).

1. **Nowoczesny Angular** — standalone components, signals, nowy control flow (`@if`/`@for`), `inject()` — zgodnie z aktualnymi zaleceniami wersji, na którą generujemy.
2. **Struktura projektu** — sensowny podział na komponenty/serwisy, brak "god components".
3. **Typowanie** — brak `any` bez uzasadnienia, poprawne typy publicznych API.
4. **Obsługa błędów i stanów** — loading/error/empty states tam, gdzie spec tego wymaga.
5. **Brak martwego kodu** — nieużywane importy, zakomentowane bloki, placeholder-y.

Kryterium "Nowoczesny Angular" wspieramy automatem skanującym przestarzały syntax (sekcja 2.6) — ta sama wersja narzędzia dla wszystkich wariantów.

Jeżeli ocenia więcej niż jedna osoba (ocena wyrywkowa / sporny wynik) — każda ocenia niezależnie, potem uzgadniamy rozbieżności (i notujemy, że były).

### 3.3. Czego NIE mierzymy (na razie)
- Subiektywnej "elegancji" kodu bez checklisty.
- Performance runtime aplikacji (Lighthouse itd.) — dopiero w dedykowanych badaniach performance z osobnym protokołem.

---

## 4. Protokół pojedynczego badania (krok po kroku)

### Faza A — Projekt badania (przed jakimkolwiek uruchomieniem)
1. **Pytanie badawcze** — jedno zdanie, np. "Czy oficjalne skille Angularowe zmniejszają zużycie tokenów przy generowaniu aplikacji X?".
2. **Hipoteza** — co spodziewamy się zobaczyć.
3. **Warianty** — lista (np. A: bez skilli, B: ze skillami). Jedna zmienna różni warianty.
4. **Specyfikacja zadania** — dokładny prompt + lista wymagań funkcjonalnych.
5. **Metryki i kryteria oceny** — które z sekcji 3, plus ewentualne testy akceptacyjne (pisane teraz, nie po fakcie).
6. **Tryb badania** — pilotażowy czy publikacyjny (sekcja 2.5); z tego wynika N: pilotaż 3 na wariant, publikacja ≥ 10 kwalifikowanych na wariant.
7. **Próg kwalifikacji przebiegu** — domyślnie: builduje się i ≥ 80% wymaganych feature'ów (patrz Faza B/C); jeśli inny, ustalamy tu.
8. **Limit budżetu na przebieg ($)** — realnie egzekwowany w komendzie uruchomienia.
9. **Konfiguracja środowiska** — model, harness, wersje, ustawienia.

Całość zapisujemy w karcie badania (szablon w sekcji 6) **zanim** odpalimy pierwszy przebieg. To chroni przed zarzutem dopasowywania kryteriów do wyników.

Walidujemy nasz projekt badania z LLM na podstawie tej metodyki z użyciem Fable 5 lub nowsze.

### Faza B — Wykonanie
1. Przygotuj czyste środowisko (świeży katalog / klon, czysta sesja).
2. Zanotuj timestamp startu.
3. **Komenda uruchomienia** — sesję odpalamy z pominięciem pytań o zgody, żeby model nie był blokowany promptami i nie potrzebował interakcji człowieka:

   ```
   claude --dangerously-skip-permissions
   ```

   Ta flaga wyłącza pytania o zgodę na operacje na plikach i komendy shell, więc przebieg odpalamy **wyłącznie w izolowanym środowisku** (VM / kontener / dedykowany katalog bez dostępu do innych projektów i bez kluczy produkcyjnych), zgodnie z sekcją 2.2.

   Gdzie potrzebujemy realnie egzekwowanego limitu budżetu i pełnego braku interakcji, dokładamy tryb non-interactive: `claude -p "<prompt>" --dangerously-skip-permissions --max-budget-usd <limit>`. Zasada bez zmian: albo limit realnie narzucamy, albo nie deklarujemy go w raporcie (koniec z przepisywaniem liczb z `/usage`).
4. Dokładną komendę uruchomienia zapisujemy w karcie badania — per przebieg, verbatim.
5. Prompt podajemy **bez żadnych dodatkowych wskazówek**. Nie ma podpowiadania ani auto-feedbacku; nie promptujemy ponownie, żeby "doratować" nieudany przebieg.
6. Sesja kończy się, gdy model deklaruje ukończenie albo po wyczerpaniu limitu budżetu / limitu tur ustalonego w Fazie A.
7. Zanotuj timestamp końca, zapisz metryki tokenów/kosztu, zarchiwizuj transcript i kod.
8. (opcjonalnie) Powtórz dla każdego przebiegu i wariantu. Kolejność przebiegów mieszamy (A, B, A, B...), nie blokowo, żeby zminimalizować wpływ pory dnia na czasy.

### Faza C — Ocena
1. Uruchom automatyczne pomiary: build, testy, lint — identyczną komendą dla wszystkich przebiegów, bez poprawiania kodu.
2. Przejdź listę wymaganych feature'ów i policz feature'y działające / wymagane.
3. **Zakwalifikuj przebieg.** Przebieg kwalifikowany = builduje się ORAZ spełnia ≥ 80% wymaganych feature'ów (próg z Fazy A).
   - Przebiegi niekwalifikowane NIE wchodzą do porównań tokenów / czasu / jakości, ale liczą się do wskaźnika porażek (X/N) i są archiwizowane na równi z pozostałymi.
4. Wypełnij ręczną checklistę jakości (0–10) dla przebiegów kwalifikowanych.
5. Zbierz wszystko w tabelę wyników — z kolumną "Kwalifikowany (T/N)".

### Faza D — Wnioski i publikacja (ODROCZONA)
Fazę D domykamy dopiero po ustabilizowaniu faz A–C. Do tego czasu badania traktujemy jako pilotażowe i nie publikujemy wniosków liczbowych. Poniższe kroki to szkic docelowy.

1. Porównaj mediany między wariantami; pokaż rozrzut.
2. Zapisz wnioski + **ograniczenia badania** (co mogło zaburzyć wynik, czego nie kontrolowaliśmy). Sekcja ograniczeń jest obowiązkowa.
3. Przygotuj materiał publikacyjny (artykuł/infografika) z linkiem do metodyki i danych.
4. Retrospektywa: co poprawić w metodyce → aktualizacja tego dokumentu (podbij wersję).

---

## 5. Typy badań (katalog)

### Typ 1 — Zużycie tokenów
Ile tokenów (input/output/cache) kosztuje wykonanie zadania.
- **1b** — z użyciem konkretnych skilli vs bez.
- **1c** — z różnymi frameworkami / bibliotekami (Angular vs React; NgRx vs Signals Store itd.).

### Typ 2 — Czas generacji
Jak długo model realizuje zadanie (metryka pomocnicza, zawsze obok tokenów).

### Typ 3 — Jakość wygenerowanego kodu
Build/testy/lint + checklista ręczna (sekcja 3.2). Opcjonalnie: performance bundle.

### Typ 4 — Praca na istniejącym projekcie
Model dostaje gotowe repo (zamrożone na konkretnym commicie) i zadanie: feature, bugfix, refaktor, migracja wersji Angulara. Mierzymy jak w typach 1–3 + "czy nie zepsuł niczego obok" (istniejące testy muszą dalej przechodzić).

### Przykładowe badania do wykonania w pierwszej kolejności
1. **Angular vs React** — ta sama specyfikacja aplikacji, porównanie tokenów i jakości. (1a: potem dorzucamy feature do obu i porównujemy koszt rozwoju.)
2. **Biblioteki stanu w Angularze** — ta sama apka, warianty: NgRx / SignalStore / czyste signals — tokeny + jakość.
3. **Oficjalne skille Angularowe: on vs off** — tokeny + jakość kodu + zgodność z nowoczesnym API Angulara (czy bez skilli model generuje przestarzałe wzorce, np. NgModules).

---

## 6. Szablon karty badania

```markdown
# Badanie NN: <tytuł>

## Metadane
- Data:
- Prowadzący:
- Wersja metodyki: 0.2

## Pytanie badawcze


## Hipoteza


## Warianty
| Wariant | Różnica |
|---|---|
| A | |
| B | |

## Konfiguracja
- Model:
- Harness + wersja:
- Ustawienia (skille, MCP, tryby):
- Środowisko: OS / Node / Angular CLI / inne:
- Tryb badania (pilotażowy / publikacyjny):
- Liczba przebiegów na wariant: (pilotaż 3 / publikacja ≥ 10 kwalifikowanych)
- Próg kwalifikacji przebiegu: build OK + ≥ 80% wymaganych feature'ów
- Limit budżetu na przebieg (realnie egzekwowany, USD):
- Dokładna komenda uruchomienia (verbatim, per przebieg): `claude --dangerously-skip-permissions`
- Izolacja kontekstu: nazwa katalogu roboczego / brancha, potwierdzenie single-branch + brak remote, potwierdzenie braku artefaktów badania w katalogu:
- Limit sesji (tury):

## Prompt (dokładny tekst)


## Skrypt odpowiedzi na ewentualne pytania modelu


## Metryki i kryteria oceny (przed startem!)
- [ ] tokeny in/out/cache
- [ ] koszt
- [ ] czas
- [ ] build (tak/nie)
- [ ] testy: <lista>
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

```

---

## 7. Zakres narzędzi i budżet

- **Modele:** przede wszystkim modele Anthropica (Claude Opus / Sonnet / Haiku) — jesteśmy partnerem; inne modele jako punkt odniesienia w wybranych badaniach.
- **Harnessy:** startowo Claude Code; docelowo także bezpośrednie wywołania API (lepsza kontrola i pomiar) i ewentualnie inne narzędzia agentowe.
- **Budżet:** najpierw wykorzystujemy istniejący pakiet subskrypcyjny; do badań wymagających precyzyjnego pomiaru tokenów przechodzimy na API (dokładne usage per request). Koszt każdego badania logujemy — sam w sobie jest daną do contentu.
- **OpenAI odroczone:** najpierw dopracowujemy metodykę na Claude Code + modelach Anthropica. Przy rozszerzeniu podejmujemy świadomą decyzję: albo porównanie całościowe narzędzi (Claude Code vs Codex), albo izolacja samych modeli wspólnym harnessem (np. OpenCode).
- **Automatyzacja:** przebiegi odpalamy non-interactive (`claude -p ... --max-budget-usd ...`, Faza B); pełny skrypt orkiestrujący serie przebiegów rozważymy, gdy metodyka się ustabilizuje.

---

## 8. Znane ograniczenia metodyki (wersja 0.2)

Spisujemy je jawnie — to element transparentności:

1. **Niedeterminizm modeli** — N=3 to minimum pozwalające zobaczyć rozrzut, ale nie daje istotności statystycznej. Nie formułujemy wniosków w stylu "model X jest o 12,3% lepszy", tylko "w naszych przebiegach model X zużywał wyraźnie mniej / porównywalnie / więcej tokenów".
2. **Czas zależny od API** — obciążenie serwerów dostawcy wpływa na czas; dlatego czas jest metryką pomocniczą.
3. **Ocena ręczna** — mimo checklisty pozostaje element subiektywny; łagodzimy to oceną niezależną przez 2 osoby tam, gdzie wynik jest kontrowersyjny.
4. **Wersje narzędzi** — modele i harnessy zmieniają się szybko; wyniki są ważne "na dzień badania" i zawsze datowane.
5. **Tokenizacja różna między dostawcami** — porównując zużycie tokenów między różnymi dostawcami porównujemy raczej **koszt w $** niż surowe tokeny.

---

## 9. Plan działania

1. **Ten tydzień:** review tego dokumentu (Grzegorz + Krzysiek), zamrożenie wersji 0.1.
2. **Przyszły tydzień (Dawid):** pilotaż — badanie nr 3 z katalogu (skille Angularowe on/off) jako najprostsze do porównania, 2 warianty × 3 przebiegi. Jak starczy czasu to badanie Angular vs React.
3. **Po pilotażu:** retrospektywa, poprawki metodyki → wersja 0.2, wybór kolejnych badań, decyzja o formacie publikacji.
