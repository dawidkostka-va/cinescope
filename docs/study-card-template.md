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
