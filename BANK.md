# BANK — validarea întrebărilor și pilotul

Jurnalul cerut de catalog pentru P13: cine a validat fiecare întrebare, când și ce a corectat,
plus rezultatele testului pilot. **Textul întrebărilor nu este aici.** Întrebările stau în baza de
date, încărcate o singură dată din `backend/database/seeders/data/questions.yaml` și editate apoi
în aplicație (D-029). Legătura se face prin **codul** întrebării.

> Date personale: pentru colegi folosește numele doar cu acordul lor (sau inițialele). Pentru
> candidații din pilot nu trece nume, doar rezultate agregate.

## 1. Validarea întrebărilor

Fiecare întrebare are nevoie de **cel puțin 2 validatori**. Cele 60 de întrebări validate sunt
pool-ul real cerut de catalog.

| Cod | Competență | Validator 1 | Validator 2 | Data | Ce au corectat | Stare |
|---|---|---|---|---|---|---|
| _M6-UG-001_ | _C4_ | _Nume / inițiale_ | _Nume / inițiale_ | _2026-11-25_ | _ex.: „unghiul exterior” → „unghi exterior”; varianta d) era tot corectă, înlocuită_ | _validată_ |

Stări: `în validare` · `validată` · `respinsă` (cu motivul în coloana „Ce au corectat”).

**Total validate:** 0 / 60

## 2. Testul pilot

Cerința: un test real cu **cel puțin 10 colegi**, pe URL-ul live, ale cărui rezultate alimentează
analiza itemilor.

| Câmp | Valoare |
|---|---|
| Data | _2026-11-30_ |
| URL | https://exam-platform-web-ip0s.onrender.com |
| Examen (titlu) | |
| Număr de candidați | |
| Durată | |
| Încercări finalizate / predate automat | |
| Media / mediana (nota 1–10) | |
| Probleme apărute în timpul pilotului | |

## 3. Analiza itemilor din pilot

Pragurile sunt cele din D-047: item slab dacă p < 0,20 sau p > 0,90, sau discriminare < 0,20;
discriminarea negativă e semnalată separat; distractor nefolosit sub 5%. Valorile vin din ecranul
de analiză a itemilor (DS-010).

| Cod | Item | p (dificultate) | Discriminare | Distractori nefolosiți | Semnalat? | Ce am făcut cu el |
|---|---|---|---|---|---|---|
| | | | | | | |

**Cel puțin o întrebare slabă identificată** (Definition of Done): _codul și motivul_.
