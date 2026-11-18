# AI Log — exam-platform-web

Jurnalul de lucru cu asistenții AI conform Politicii AI din catalogul de proiecte.

---

## 2026-11-18 · Interviu de scope, stabilire variabile și stack tehnic P013
Unealta: Antigravity (prompt liber).
Ce am cerut (pe scurt): Clarificarea cerințelor și stabilirea completă a scope-ului pentru proiectul P013 (bancă de întrebări și examene parametrizate) printr-un interviu ghidat pas cu pas pe baza fișei din catalog și a notițelor din INTERVIEW.md, fără a scrie cod. Am cerut definirea variabilelor personale, rolurilor, ecranelor, non-scopurilor, documentarea termenilor în CONTEXT.md, a necunoscutelor în OPEN-QUESTIONS.md și formularea deciziilor tehnice ca PROPOSALS.
Ce am primit: Un interviu structurat, adresat întrebare cu întrebare, acoperind disciplina (matematică clasa a VI-a), structura examenului (10p oficiu, 30p Subiectul 1 automat binar, 60p Subiectul 2 manual cu punctaj parțial), toleranța (exact match) și fereastra de grație (30s). Inițial, asistentul a generat o propunere automată de stack (Next.js/Prisma) înainte de discuție; l-am corectat indicând că stack-ul nu a fost discutat și am specificat Laravel 11, React + Vite și PostgreSQL. Asistentul a actualizat documentele și a formulat propunerile de decizie D-002–D-006.
Ce am făcut cu ea: Am eliminat tipul de întrebare „ordonare” din scope, am redirecționat modelarea generării parametrizate în OPEN-QUESTIONS.md (Q-004) pentru clarificare ulterioară cu profesorul, am selectat stack-ul definitiv (Laravel 11, React + Vite, PostgreSQL), am aprobat propunerile de decizie tehnică în DECISIONS.md și am validat conformitatea registrului prin ledger-lint.

## 2026-11-18 · Interviu de stil vizual și aprobare tokeni DESIGN.md
Unealta: Antigravity (prompt liber).
Ce am cerut (pe scurt): Un interviu axat pe stilul vizual (culori, fonturi, ton, website-uri de referință), urmat de propunerea tokenilor de design (culori light/dark, fonturi, spațiere) în docs/design/DESIGN.md ca PROPOSAL și așteptarea aprobării mele.
Ce am primit: Întrebări structurate privind atmosfera platformei, culorile de accent, fonturile pentru UI și formule matematice, respectiv referințele vizuale. Am indicat un ton calm, fără elemente grafice copleșitoare pentru a reduce anxietatea la examen, accent Muted Sage/Teal, fundal dark midnight, font Plus Jakarta Sans pentru text și JetBrains Mono pentru formule/cronometru, cu referințe la Coursera, Quizlet și Notion. Asistentul a populat tabelele de tokeni din docs/design/DESIGN.md cu contraste WCAG AAA/AA și a formulat propunerea D-007.
Ce am făcut cu ea: Am revizuit valorile tokenilor de culoare, tipografie și spațiere, am aprobat propunerea D-007 înregistrată în DECISIONS.md și am verificat integritatea registrului prin ledger-lint.

## 2026-11-18 · Înregistrare ecrane registry.yaml și desenare mock DS-003
Unealta: Antigravity (prompt liber).
Ce am cerut (pe scurt): Propunerea listei complete de ecrane cu ID-uri DS- în docs/design/registry.yaml pe baza scope-ului din README.md, fără a desena inițial nimic. Ulterior, am cerut realizarea mock-ului pentru tabloul de bord al candidatului (DS-003) în docs/design/mocks/, cu status draft, folosind exclusiv tokenii din DESIGN.md și acoperind stările empty, loading, error, success și long text, atât în light cât și dark mode.
Ce am primit: Înregistrarea celor 12 ecrane (DS-001 până la DS-012) mapate pe rolurile Candidat, Examinator și Administrator în registry.yaml. Apoi, fișierul HTML de sine stătător docs/design/mocks/DS-003.html cu bară interactivă de comutare a temelor (Light / Dark Midnight) și a stărilor (Success cu examen în desfășurare și cronometru, Empty, Skeleton loading, Alertă de eroare cu reîncercare și Long text cu wrapping pe titluri lungi de olimpiadă).
Ce am făcut cu ea: Am verificat că mock-ul folosește strict variabilele CSS corespunzătoare tokenilor (Plus Jakarta Sans, JetBrains Mono, culorile Teal/Midnight, spațierea pe grilă de 4px) și că starea din registry.yaml este menținută ca draft.

## 2026-11-18 · Conectare link Figma și export tokeni
Unealta: Antigravity (prompt liber).
Ce am cerut (pe scurt): Regenerarea Figma și furnizarea link-ului fișierului țintă din Figma pentru proiect.
Ce am primit: Actualizarea fișierului docs/design/DESIGN.md cu URL-ul de Figma furnizat sub secțiunea Source, instrucțiuni de importare a mock-ului DS-003.html în frame-ul „DS-003 · candidate-dashboard” și generarea fișierului de export docs/design/tokens.json compatibil cu Figma Tokens Studio / Variables (culori, fonturi, spațieri, raze).
Ce am făcut cu ea: Am înregistrat URL-ul Figma în DESIGN.md și am verificat integritatea fișierelor prin ledger-lint.

## 2026-11-18 · Rafinare și aprobare mock DS-003 (candidate-dashboard)
Unealta: Antigravity (prompt liber).
Ce am cerut (pe scurt): Eliminarea emoji-urilor de pe butoanele de comutare dark/light, redenumirea platformei din „Evaluare matematică” în „Platforma evaluare” în navbar, urmată de confirmarea mock-ului.
Ce am primit: Actualizarea fișierului docs/design/mocks/DS-003.html cu etichetele curate „Light” și „Dark (Midnight)” și denumirea actualizată, ghidaj pentru înlocuirea cadrului în Figma, și promovarea statusului DS-003 la „approved” în docs/design/registry.yaml.
Ce am făcut cu ea: Am vizualizat și confirmat noul mockup în Figma, am promovat statusul ecranului în registru și am verificat integritatea fișierelor prin ledger-lint.

## 2026-11-18 · Audit documentație, rezolvare Q-005 și stabilire cerințe tehnice
Unealta: Antigravity (prompt liber).
Ce am cerut (pe scurt): Verificarea completă a documentelor (README.md, CONTEXT.md, OPEN-QUESTIONS.md, mocks din docs/design) pentru contradicții, elemente lipsă sau neclare, și formularea întrebărilor rămase. Apoi, actualizarea ARCHITECTURE.md și răspunsul la întrebările legate de predarea Subiectului 2 (upload foto + text), politica încercărilor multiple și biblioteca de parsare matematică în PHP.
Ce am primit: Corectarea neconcordanțelor de vocabular din README.md și DS-003.html, actualizarea completă a fișierului ARCHITECTURE.md (cu monorepo backend/ și frontend/, diagrame de flux, storage și securitate), închiderea Q-005 și D-010 (publicarea feedback-ului), și formularea propunerilor de decizie D-011–D-013.
Ce am făcut cu ea: Am aprobat decizia D-010, am cerut actualizarea ARCHITECTURE.md, am confirmat opțiunea de upload foto pentru Subiectul 2, politica de încercări multiple și folosirea unei biblioteci dedicate de expresii matematice în PHP fără eval.
