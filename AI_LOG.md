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

## 2026-11-22 · Plan general al aplicației (roadmap P0–P12)
Unealta: Claude Code (/plan).
Ce am cerut (pe scurt): Un plan la nivelul întregii aplicații, pe care să-l împart apoi în planuri mai mici.
Ce am primit: Un roadmap cu 13 părți (P0–P12) în ordinea dependențelor, cu deciziile acoperite de fiecare parte, ecranele, riscurile (stocarea fotografiilor și jobul programat pe Render) și 8 întrebări deschise. Asistentul a observat că planul vechi de schemă era depășit de decizii mai noi și că în backend/ exista un schelet necomis, construit după acel plan.
Ce am făcut cu ea: Am pornit direct cu P0. Mai târziu am observat că roadmap-ul nu fusese salvat nicăieri și am cerut salvarea lui în docs/plans/application-roadmap.md, împreună cu întrebările deschise (Q-027–Q-034).

## 2026-11-22 · P0: planul pentru fundație (Docker, CI, Render)
Unealta: Claude Code (/plan).
Ce am cerut (pe scurt): Planul pentru P0: schelet backend și frontend, CI și deploy.
Ce am primit: Un plan cu trei întrebări blocante: ce fac cu folderul backend/ necomis, unde rulează PHP local (nu aveam PHP instalat) și faptul că Laravel 11 (D-002) nu mai are suport de securitate. Asistentul a propus D-036 (Laravel 13) și a corectat singur o afirmație exagerată despre suportul Laravel 11 după ce a verificat pe Packagist.
Ce am făcut cu ea: Am ales schelet nou cu migrările vechi păstrate deoparte, Laravel rulat în Docker și propunerea pentru Laravel 13. Am întrebat ce înseamnă D-036 înainte să-l aprob. Am aprobat CI pe GitHub Actions (D-037) și româna ca limbă implicită (D-038), am cerut merge în main înainte de branch-ul P0 și am reconfirmat D-009 și D-014 după reformulare.

## 2026-11-22 · P0: build, dovada testelor și deploy pe Render
Unealta: Claude Code (/build), apoi ghidaj pas cu pas pentru Render.
Ce am cerut (pe scurt): Construirea P0, apoi dovada că testele rulează local, confirmarea explicită că nu au apărut termeni sau întrebări noi și că nu s-au schimbat ecrane, apoi punerea aplicației online.
Ce am primit: Backend Laravel 13 în Docker, frontend React 19 cu tokenii din DESIGN.md, română/engleză, CI și render.yaml, cu teste scrise înainte de cod. La verificare, asistentul a găsit și a reparat un avertisment de configurare Vite introdus chiar de el. La deploy, adresele ghicite (exam-platform-api.onrender.com) aparțineau altcuiva, așa că site-ul ar fi apelat serverul altei persoane.
Ce am făcut cu ea: Am cerut o explicație pe înțeles pentru problema adreselor, am corectat VITE_API_BASE_URL în Render și am refăcut build-ul site-ului. Am verificat site-ul live („Conectat la server”). Am cerut să păstrez în minte expirarea bazei de date gratuite (~22 decembrie) și să decid mai târziu ce fac cu ea.

## 2026-11-22 · Review cu trei sub-agenți pe P0 (performanță, securitate, SEO)
Unealta: Claude Code (trei sub-agenți în paralel, doar raportare).
Ce am cerut (pe scurt): Review al diff-ului P0 față de plan și README, cu probleme de corectitudine doar, cu fișier și linie.
Ce am primit: 7 probleme confirmate (noindex lipsă, porturi Docker expuse în rețea, CI fără permisiuni limitate, APP_ENV, caching, sesiuni scrise în bază, build Docker lent) și 4 pentru P2. O constatare (OPcache „dezactivat”) a fost respinsă după verificarea imaginii: era activat.
Ce am făcut cu ea: Am cerut aplicarea tuturor celor 7, inclusiv a celei opționale, și am lăsat deoparte ce ține de P2. Am verificat că CI trece.

## 2026-11-22 · Verificare de conformitate și program până la predare
Unealta: Claude Code (prompt liber).
Ce am cerut (pe scurt): Dacă ce am făcut e conform cu cerințele și dacă am deraiat.
Ce am primit: Direcția este conformă, dar ritmul e un risc: commit-uri în doar 4 zile din cele 8 cerute, AI_LOG cu 6 intrări din 10, twist-ul neînceput, nicio întrebare reală, niciun pilot. Plus lista abaterilor de la catalog care trebuie explicate (ordonare, punctaj negativ, toleranță 0).
Ce am făcut cu ea: Am corectat termenul de predare (3 decembrie, nu 6). Am acceptat programul comprimat pe 11 zile, cu pilotul pe 30 noiembrie și o listă de tăieri hotărâtă de acum, adăugate în roadmap.

## 2026-11-22 · P1: modelul de date pentru competențe, capitole și bănci
Unealta: Claude Code (/plan).
Ce am cerut (pe scurt): Planul schemei de bază de date (P1).
Ce am primit: Un plan mare, cu o listă fixă de competențe (D-030), capitole fixe din programă și o propunere de topic-uri seedate.
Ce am făcut cu ea: Am cerut împărțirea planului (P1a–P1d). L-am corectat de mai multe ori. „Mulțimi de numere” este un capitol, nu o competență. Competențele sunt stabilite de profesor, nu din listă fixă. Capitolele sunt doar etichete, nu structură. Seed-ul nu înseamnă „hardcodat”. Rezultatul a fost D-039, care înlocuiește D-030. Am observat apoi că „mai multe bănci” era de fapt ce catalogul numește „pool-uri” (banca cuprinde toate întrebările) și am ales ca itemii din examen să extragă din pool-uri (D-041, D-043).

## 2026-11-22 · P1a: build și review cu sub-agenți (PR #1)
Unealta: Claude Code (/build, apoi trei sub-agenți de review).
Ce am cerut (pe scurt): Construirea P1a (roluri, competențe, clase), un pull request cu gh și apoi review-ul cu trei sub-agenți.
Ce am primit: Tabelele și testele (8 teste trecute). Review-ul a găsit două chei străine fără index și câmpuri care ar fi putut fi setate din formular (statusul cererii de intrare în clasă, codul clasei), plus o neconcordanță în README.
Ce am făcut cu ea: Am cerut o explicație pe înțeles pentru mass assignment înainte să decid. Am ales varianta mai strictă (modelul refuză complet completarea din formular) și am aprobat schimbarea testului care aștepta altceva. Am aprobat merge-ul PR-ului după ce CI a trecut.

## 2026-11-22 · P1b: banca de întrebări, pool-uri, Draft și Ready
Unealta: Claude Code (/plan, /build).
Ce am cerut (pe scurt): Planul și construirea schemei pentru banca de întrebări.
Ce am primit: Întrebări despre minimul pentru Draft și cerințele pentru Ready, propunerile D-040 (bibliotecă cu copii înghețate), D-041 (pool-uri) și D-042, apoi tabelele, constrângerile în Postgres și 12 teste noi.
Ce am făcut cu ea: Am cerut ca Ready să ceară și clasa (anul de studiu) și dificultatea (D-042 înlocuiește D-032). Am întrebat dacă ideea de mai multe pool-uri respectă cerințele proiectului, ceea ce a clarificat diferența dintre bancă și pool. Am hotărât că o întrebare extrasă trebuie să aibă competența și dificultatea itemului și că nu se poate repeta în aceeași încercare (Q-036, Q-037).

## 2026-11-22 · Răspunsuri la întrebările care blocau twist-ul (Q-027–Q-031)
Unealta: Claude Code (prompt liber).
Ce am cerut (pe scurt): Să răspund pe rând la întrebările deschise, cu o recomandare pentru fiecare.
Ce am primit: Opțiuni cu recomandări pentru stocarea fotografiilor, predarea automată pe Render, ordinea aleatoare, recalcularea după corectarea baremului de răspuns și pragurile pentru itemi slabi. După primul meu răspuns, asistentul a observat că stocarea pe discul local s-ar ciocni cu programul: deploy-ul P8 de după pilot ar fi șters fotografiile pilotului înainte de corectare.
Ce am făcut cu ea: Am ales inițial discul local, apoi am trecut la stocare de obiecte gratuită (D-048, care înlocuiește D-011) după ce am văzut conflictul. Am aprobat D-044–D-047: verificare la citire plus job declanșat extern, amestecarea variantelor de răspuns, recalculare până la publicare și praguri standard.

## 2026-11-22 · Controlul operațiilor pe git (push, merge)
Unealta: Claude Code (prompt liber).
Ce am cerut (pe scurt): Să-mi arate comenzile și să aștepte aprobarea mea înainte de orice push sau merge.
Ce am primit: La un pas pe care l-am întrerupt, merge-ul și push-ul în main se executaseră deja. Asistentul mi-a spus inițial că nu rulase nimic, apoi a recunoscut eroarea după ce a verificat starea repo-ului.
Ce am făcut cu ea: Am verificat că rezultatul era exact ce aș fi aprobat (fast-forward, CI verde). De atunci am cerut ca fiecare push și merge să-mi fie arătate înainte și am aprobat fiecare pas separat.

## 2026-11-24 · Bug: parola nouă vizibilă la examinator → resetare doar de administrator, cu parolă temporară
Unealta: Claude Code (/plan).
Ce am cerut (pe scurt): Repararea unui bug: când examinatorul setează o parolă nouă pentru un candidat, parola apare în clar pe ecran și se scrie o singură dată, fără confirmare.
Ce am primit: Un plan mic (câmp de parolă ascuns cu buton arată/ascunde și un al doilea câmp de confirmare, ca la înregistrare). Asistentul a observat că mock-ul aprobat DS-013 desena chiar câmpul în clar, deci codul respecta designul și schimbarea atingea ceva deja aprobat.
Ce am făcut cu ea: M-am răzgândit asupra fluxului: parolele le schimbă doar administratorul, parola setată e temporară, iar utilizatorul e obligat să-și aleagă alta la următoarea autentificare. Asistentul a formulat propunerea care înlocuiește D-020 și 5 întrebări. Am răspuns: ecranul de administrator se face acum, administratorul scrie parola de două ori (ascunsă), regula e pentru toți utilizatorii, inclusiv conturile noi de examinator, parola nouă trebuie să difere de cea temporară, parola temporară nu expiră, iar butonul examinatorului dispare (D-054, Q-042).

## 2026-11-24 · Ecranul de administrator: conturi de examinator, dezactivare, roluri fixe
Unealta: Claude Code (/plan).
Ce am cerut (pe scurt): Ca tabloul de bord al administratorului să cuprindă și crearea conturilor de examinator și dezactivarea utilizatorilor. Rolurile nu se schimbă. Am cerut și explicarea deciziilor pe care se sprijinea planul înainte să le confirm.
Ce am primit: O explicație pe înțeles pentru fiecare decizie folosită (token-uri și deconectare la schimbarea parolei, interfață bilingvă, iconițe Lucide, sistemul vizual, coduri de eroare în loc de propoziții), propunerea D-055 (roluri fixe) și trei întrebări noi: reactivare, dezactivarea altor administratori, email deja folosit.
Ce am făcut cu ea: Am confirmat toate cele cinci intrări și propunerea D-055. Am hotărât că un cont dezactivat nu se mai reactivează și că un administrator nu poate dezactiva alt administrator (D-056, Q-043, Q-044).

## 2026-11-24 · Mock-urile DS-011, DS-018 și DS-013, corectate după feedback
Unealta: Claude Code (prompt liber, mock-uri HTML verificate în light și dark, pe desktop și la 320 px).
Ce am cerut (pe scurt): Desenarea ecranului de utilizatori (DS-011), a ecranului de parolă nouă obligatorie (DS-018) și scoaterea parolei din DS-013.
Ce am primit: Cele trei mock-uri. Asistentul a găsit singur în propriile capturi că tabelul de utilizatori depășea ecranul pe telefon și l-a refăcut pe rânduri stivuite.
Ce am făcut cu ea: Am cerut trei corecturi la tabelul din DS-011: titlul tabelului era inutil (pagina are deja titlu), o liniuță rătăcită pe rândul meu și antetul „Acțiuni” nealiniat cu butoanele. După corecturi am aprobat mock-urile.

## 2026-11-24 · P3b: build, merge, push și deploy
Unealta: Claude Code (/build).
Ce am cerut (pe scurt): Construirea planului aprobat, apoi merge, push și deploy.
Ce am primit: Testele scrise înainte de cod, apoi codul: backend 127 de teste, frontend 101, Playwright 44, toate trecute. Raportul a numit testele șterse (resetarea de către examinator) și cele modificate, plus o abatere de la plan: coloana „Acțiuni” din DS-013 ar fi rămas goală, așa că a fost scoasă până la răspunsul la Q-041. A semnalat și un test instabil fără legătură cu schimbarea (a picat o dată, apoi a trecut de 14 ori). După push, CI a trecut și asistentul a verificat site-ul live (ruta de administrator există, ruta veche a examinatorului dă 404).
Ce am făcut cu ea: Am aprobat merge-ul în main, push-ul și deploy-ul pe Render.

## 2026-11-24 · Șablonul de examen: itemi după competență, dificultate, tip și temă; valori fixe, aleatoare, calculate
Unealta: Claude Code (prompt liber, apoi propuneri de decizie).
Ce am cerut (pe scurt): Am descris cum trebuie să funcționeze șablonul de examen: fiecare item extrage automat o întrebare din pool după dificultate, tip, temă și competență. La crearea unei întrebări se setează dificultatea, tipul, tema, clasa (nivelul) și competența, iar un comutator „parametrizat” deschide domeniul valorilor. Valorile fixe, cele generate aleator și cele calculate din ele trebuie marcate.
Ce am primit: O comparație cu deciziile aprobate. Partea despre întrebare exista deja în mock-ul DS-007 (valori între acolade, intervale, valori calculate). Partea despre itemi contrazicea D-043 (itemul potrivea doar competența și dificultatea) și D-039 (temele „nu structurează nimic”). Am primit propunerea de schimbare și 4 întrebări (Q-045–Q-048).
Ce am făcut cu ea: Am răspuns: itemul extrage în continuare dintr-un pool, o întrebare are exact o temă, tipul și tema itemului pot fi „oricare”, valorile aleatoare sunt numere întregi cu valori excluse opționale. Am lăsat la alegerea asistentului dacă valorile fixe primesc și ele nume (a ales da, ca toate trei tipurile să fie vizibile). Am aprobat D-057, D-058 și D-059, care înlocuiesc D-043, D-039 și D-042.

## 2026-11-24 · Mock-urile DS-007 (bancă de întrebări) și DS-008 (constructor de examen) refăcute
Unealta: Claude Code (prompt liber, mock-uri HTML verificate în light și dark, pe desktop și la 320 px).
Ce am cerut (pe scurt): Actualizarea celor două mock-uri după noile decizii.
Ce am primit: DS-007 cu filtre și câmpuri pentru temă, set, tip și nivel, editor de valori (fixă / aleatoare cu minim, maxim și excepții / calculată) și o stare pentru o valoare folosită în enunț dar nedefinită. DS-008 cu nivelul examenului, criteriile fiecărui item, numărul de întrebări care se potrivesc și un dialog de editare a itemului. Asistentul a descoperit că mock-urile aprobate anterior depășeau lățimea ecranului pe telefon și le-a reparat. A propus termenii „Temă” și „Nivel” în locul lui „Etichetă” și al ambiguului „Clasă”.
Ce am făcut cu ea: Am confirmat ambele mock-uri și termenii, care au intrat în CONTEXT.md.

## 2026-11-24 · P4a și P4b: motorul de calcul și banca de întrebări
Unealta: Claude Code (/plan, /build).
Ce am cerut (pe scurt): Planul și construirea motorului matematic (valori fixe, aleatoare și calculate, formule evaluate fără `eval`, potrivirea răspunsurilor) și apoi a băncii de întrebări (DS-007). Pe parcurs am întrebat unde scriu întrebările mele.
Ce am primit: Motorul (P4a) cu teste scrise înainte de cod: valori reproductibile dintr-un seed, condiții, virgulă sau punct zecimal, forma de fracție cerută, text fără diacritice. Pentru formule a propus text simplu cu simboluri Unicode, fără bibliotecă nouă (D-060). Apoi banca (P4b, contractul C-004) și un fișier gol `questions.yaml` pentru întrebările mele, care urmează să fie încărcate în P4c.
Ce am făcut cu ea: Am aprobat ambele planuri și D-060, am confirmat mock-ul și am cerut merge și push după fiecare parte. Am spus că am doar 12 întrebări deocamdată și am cerut să trecem la alți pași până le completez.

## 2026-11-25 · P5: constructorul de examen și publicarea
Unealta: Claude Code (/plan, /build).
Ce am cerut (pe scurt): Planul pentru constructorul de examen (DS-008): setări, itemi, verificările de publicare, previzualizare.
Ce am primit: O potrivire „fiecare item cu întrebarea lui” care nu eșuează când există o soluție (potrivire bipartită, reproductibilă din seed), verificări de publicare ca coduri (30 + 60 de puncte, o întrebare distinctă pe item, clase), listă de examene și constructorul cu salvare automată.
Ce am făcut cu ea: Am răspuns la cele cinci întrebări (Q-059–Q-063), am cerut să fie implementate și observațiile găsite la review, am confirmat ecranele și am cerut merge și push.

## 2026-11-25 · P6: motorul încercărilor (twist-ul), împărțit în patru
Unealta: Claude Code (/plan, /build).
Ce am cerut (pe scurt): Planul pentru P6. L-am găsit prea mare și am cerut să fie împărțit, și am întrebat explicit dacă include twist-ul.
Ce am primit: P6 împărțit în P6a (pornire și extragere: valori diferite pentru fiecare candidat, seed reproductibil pentru contestații), P6b (cronometru pe server, grație, autosave cu versiuni, predare, sigilare), P6c (corectarea Subiectului I) și P6d (fotografii). Am primit și harta: care parte acoperă care bucată din twist.
Ce am făcut cu ea: Am aprobat împărțirea (Q-065) și fiecare plan. Înainte de merge la P6a am cerut două verificări: că cheia de răspuns și răspunsul calculat se potrivesc cu ordinea amestecată a variantelor, și refuzurile la pornire în condiții de concurență. Prima a trecut fără modificări. A doua a găsit un defect: două porniri simultane ajungeau la cheia unică din baza de date și primeau 500 în loc de 409. Asistentul l-a dovedit cu 20 de cereri paralele, inclusiv cu lacătul scos ca probă, și l-a reparat.

## 2026-11-25 · Cron extern și review cu trei sub-agenți pe P6b
Unealta: Claude Code (prompt liber, sub-agenți).
Ce am cerut (pe scurt): Am întrebat de ce e nevoie de cron-job.org, ce se întâmplă fără el și ce e în linie cu twist-ul. Apoi am cerut review pe PR #11 cu trei sub-agenți: performanță, securitate, SEO și GEO.
Ce am primit: Explicația: rezultatele rămân corecte și fără cron (sigilare la citire), cronul ține API-ul gratuit treaz pentru pilot și evaluare, iar twist-ul e acoperit în ambele variante. La review: nicio problemă gravă, patru mărunte confirmate în cod (o versiune prea mare dădea 500, marcajul de revizuire se pierdea dacă lipsea din cerere, secretul cronului lipsea din render.yaml, o precizare în documentație).
Ce am făcut cu ea: Am păstrat cron-job.org, am generat singură secretul și l-am pus în Render, am creat jobul și am verificat răspunsul 200. Am cerut cele patru reparații și push. Am întrebat dacă pot opri jobul cât lucrez singură. Răspunsul a fost da, iar datele de repornire (29 noiembrie și de la predare până la evaluare) au intrat în roadmap.

## 2026-11-25 · P6c: corectarea automată a Subiectului I
Unealta: Claude Code (/plan, /build).
Ce am cerut (pe scurt): Planul și construirea corectării Subiectului I.
Ce am primit: Corectare la predare și la sigilare, din instantaneul încercării: pozițiile afișate traduse prin ordinea stocată, răspunsul scurt verificat față de răspunsul calculat din valorile acelei încercări, punctaj întreg sau 0. Nimic nu se arată candidatului înainte de publicare.
Ce am făcut cu ea: Am aprobat amânarea recalculării la corectarea cheii (D-046) pentru P8 și am cerut merge și push.

## 2026-11-25 · Butoanele din dialoguri și tabelul de utilizatori
Unealta: Claude Code (prompt liber, cu captură de ecran).
Ce am cerut (pe scurt): Am raportat două probleme la ecranul de administrator: butoanele din formularul „Examinator nou” erau disproporționate, iar tabelul era prea lat, cu mult spațiu gol în dreapta.
Ce am primit: Trei variante desenate pentru butoane și două pentru tabel. După alegerea mea: butoane în jumătăți egale în toate cele 10 dialoguri (o componentă comună, PATTERN-008) și pagina de utilizatori limitată la 1024 px.
Ce am făcut cu ea: Am ales variantele, am verificat capturile și am cerut merge și push.

## 2026-11-25 · P7: experiența candidatului, împărțită în patru
Unealta: Claude Code (/plan, /build).
Ce am cerut (pe scurt): Planul pentru P7. L-am cerut împărțit în planuri mai mici și apoi încă o dată pentru partea camerei de examen.
Ce am primit: P7a (tabloul de bord și intrarea într-o clasă), P7b (camera de examen: citire și răspuns), P7c (cronometru și predare), P7d (offline și reluare). Pentru fiecare: completări desenate în mock-uri, confirmate înainte de cod.
Ce am făcut cu ea: Am decis descrierea examenului pe card, doar etichetele de temă, fără fotografii și fără tabelul de examene predate până la P9 (Q-064, Q-069, Q-070). Am ales un item pe ecran (Q-072). Am acceptat un câmp nou în API ca pagina să poată spune „nu ești într-o clasă” sau „cererea ta așteaptă”. Am cerut să păstrez P7a nemerged până la P7b, ca nimeni să nu pornească un examen fără cameră de examen. Am aprobat și repararea antetului candidatului pe telefon.

## 2026-11-25 · Fontul formulelor în camera de examen
Unealta: Claude Code (prompt liber, apoi propunere de decizie).
Ce am cerut (pe scurt): Mi-a displăcut că tot enunțul era scris cu JetBrains Mono. Am cerut ca doar numerele și formulele să folosească acest font.
Ce am primit: Explicația (textul e simplu, deci matematica trebuie recunoscută automat), regula de recunoaștere cu exemple și limita ei (cuvinte de o literă), plus propunerea de schimbare a D-060.
Ce am făcut cu ea: Am decis ca doar camera de examen să se schimbe deocamdată, iar ecranele examinatorului să rămână cum sunt. A rezultat D-061, care înlocuiește D-060. Am confirmat mock-ul redesenat.

## 2026-11-25 · P7c și P7d: cronometru, predare, offline și reluare; P7 live
Unealta: Claude Code (/plan, /build, Playwright).
Ce am cerut (pe scurt): Construirea cronometrului și a predării, apoi a părții offline, și verificarea twist-ului: refresh-ul, închiderea tab-ului și pierderea conexiunii nu pierd nimic.
Ce am primit: Cronometru după ceasul serverului (corect și cu ceasul telefonului greșit), avertismente la 5 și la 1 minut, dialog de predare, ecranele „Examen predat” și „Timp expirat”. Răspunsurile se păstrează pe dispozitiv până le confirmă serverul, se retrimit singure și se trimit în perioada de grație la expirare. Cele trei teste Playwright cerute de catalog trec, iar rulate pe codul dinainte de P7d au picat toate trei, deci testele chiar verifică ceva. Asistentul mi-a cerut acordul înainte să modifice trei teste vechi care verificau un mesaj temporar înlocuit prin plan, și a spus deschis că a făcut retrimiterea automată doar la pierderea conexiunii, nu și la erorile de server.
Ce am făcut cu ea: Am aprobat planurile și mock-urile, am dat acordul pentru testele vechi și am cerut merge și push pentru tot P7. E live din 25 noiembrie, ora 21:07.

## 2026-11-26 · Reparația CI pentru HEIC și cursa la reluare; review cu trei sub-agenți
Unealta: Claude Code (prompt liber, sub-agenți).
Ce am cerut (pe scurt): Să comit reparația rămasă din sesiunea anterioară (CI-ul nu avea heif-convert pentru testele HEIC, iar la reluarea unui examen un clic rapid putea pierde copia de pe dispozitiv a unui răspuns), apoi push, PR și un review pe PR #12 cu trei sub-agenți: performanță, securitate, SEO și GEO.
Ce am primit: Asistentul nu a comis un package-lock.json gol din rădăcina repo-ului, deși îl pusesem în listă, și mi-a explicat că e un fișier rămas din greșeală; l-am șters la propunerea lui. Testele camerei de examen au trecut, CI-ul a fost verde. Cei trei sub-agenți nu au găsit nicio problemă; cel de SEO a fost instruit despre D-052 (nicio pagină indexată), ca să nu raporteze ca defecte lipsa meta-tagurilor.
Ce am făcut cu ea: Am cerut merge pentru PR #12 și ștergerea ramurilor după ce asistentul a verificat că toate commit-urile lor erau deja pe main.

## 2026-11-26 · P4c: încărcarea întrebărilor din questions.yaml
Unealta: Claude Code (/plan, /build).
Ce am cerut (pe scurt): Planul pentru P4c. La întrebările asistentului am pus la rândul meu trei întrebări: dacă încărcarea din calculatorul meu în baza de date live are vulnerabilități, dacă ar trebui să înlocuiesc Render și dacă varianta e conformă cu cerințele.
Ce am primit: O comandă `app:load-questions <email>` care verifică tot fișierul înainte să scrie ceva, inserează doar codurile noi și face Ready doar întrebările complete. Despre securitate: riscul real e parola din URL-ul bazei de date (istoricul shell-ului, conexiune necriptată), cu pași concreți (`read -s`, `sslmode=require`, limitarea accesului din Render). Despre Render: nu pentru asta, dar mutarea pe AWS rămâne necesară pentru predare (Q-073), după pilot. Despre conformitate: asistentul a citit catalogul și mi-a arătat că, dacă țin questions.yaml în afara git-ului, evaluatorul AI nu găsește „seed-ul real”.
Ce am făcut cu ea: Mi-am schimbat decizia: questions.yaml se comite, știind că răspunsurile devin publice (Q-074). Am ales Draft pentru întrebările incomplete și încărcarea din calculatorul meu. Am aprobat planul, am cerut push, PR și merge (PR #13).

## 2026-11-26 · P8: planul de corectare și publicare a rezultatelor
Unealta: Claude Code (/plan).
Ce am cerut (pe scurt): Planul pentru P8, corectarea Subiectului II și publicarea rezultatelor, necesar pe 1 decembrie, după pilot.
Ce am primit: Asistentul a găsit o problemă pe care n-o observasem: punctele unui item pot fi diferite de punctele întrebării extrase, dar baremul însumează punctele întrebării. A găsit și că salvarea baremului din banca de întrebări ar fi șters toate punctajele date pe pași. A propus împărțirea în P8a (corectare și publicare), P8b (pagina de rezultate a candidatului) și P8c (corectarea cheii după predare). Când am cerut detalii despre schimbarea C-004, a recunoscut singur un defect în propria variantă (pașii potriviți după poziție se încurcă la ștergerea unui pas din mijloc) și a revizuit-o: pașii păstrați după id, recalculare cu marcaj de reverificare, blocare după publicare.
Ce am făcut cu ea: Am respins varianta lui pentru puncte și am decis o structură fixă: Subiectul II are 3 probleme de 20 de puncte (D-062), așa că pilotul are acum 3 probleme în loc de 2. Am ales publicarea doar după ce totul e corectat, nu mai lucrează nimeni și s-a încheiat fereastra examenului (Q-076). Am cerut ambele moduri de corectare și editarea baremului direct în ecranul de corectare, fără tăieri (Q-078). Am aprobat C-004 revizuit și planul.

## 2026-11-26 · P8a: backend-ul de corectare și mock-urile DS-009
Unealta: Claude Code (/build, Playwright pentru capturile mock-urilor).
Ce am cerut (pe scurt): Construirea P8a.
Ce am primit: Pe backend, testele scrise întâi și apoi codul, în trei pași: regula D-062 (cu constrângeri în baza de date care nu blochează deploy-ul pe date vechi), schimbarea C-004 și API-ul de corectare C-007. Asistentul a observat că editorul trimite toată întrebarea la fiecare salvare, așa că blocarea refuză doar o schimbare reală a baremului sau a cheii, nu și corectarea unei greșeli de tipar. A cerut acordul meu înainte să schimbe o aserțiune dintr-un test P4c pe care D-062 o făcea greșită. Pentru ecran a desenat întâi completările mock-urilor DS-009 și DS-008, le-a verificat în capturi și a reparat trei stări care nu se afișau corect.
Ce am făcut cu ea: Am aprobat schimbarea aserțiunii (pas de barem 6 → 16, problema are acum 20 de puncte) și am confirmat mock-urile. Două detalii decise de asistent fără o regulă au rămas întrebări deschise, cu răspunsul propus: marcajul de reverificare nu blochează publicarea (Q-079), iar un examen fără dată de încheiere nu poate publica rezultatele (Q-080). Ecranul de corectare rămâne de construit; testele lui sunt scrise.

## 2026-11-27 · INTERVIEW.md: antetul și legătura cu deciziile
Unealta: Claude Code (prompt liber).
Ce am cerut (pe scurt): Completarea antetului din INTERVIEW.md cu datele pe care i le-am dat și o secțiune care leagă răspunsurile profesorului de deciziile din proiect.
Ce am primit: Asistentul a verificat întâi în catalog că poate scrie fișierul fără să încalce regulile (contează ca datele să fie reale, nu cine le scrie) și a lăsat câmpul de acord gol până i l-am spus. Răspunsurile au rămas neschimbate. Secțiunea „Ce am decis din interviu” leagă 10 răspunsuri de decizii, fiecare verificată în textul deciziei; o legătură greșită (D-013 la întrebarea 5) a corectat-o singur înainte să o scrie, iar analiza itemilor e marcată ca încă de construit.
Ce am făcut cu ea: Am dat data, inițialele, modul de desfășurare și acordul verbal, și am cerut secțiunea cu deciziile. Follow-up-ul îl adaug eu mai târziu.

## 2026-11-27 · P8a: ecranul de corectare și trei întrebări rămase deschise
Unealta: Claude Code (/build, Playwright în Docker).
Ce am cerut (pe scurt): Să continui P8a de unde rămăsese și să-mi explice întrebările deschise Q-079 și Q-080.
Ce am primit: Asistentul a construit ecranul de corectare (DS-009) din testele scrise deja, a comparat capturile cu mock-ul și a reparat trei diferențe de aranjare. A găsit singur o problemă nouă: după publicarea rezultatelor, data de încheiere se putea muta, redeschizând examenul cu notele deja vizibile (Q-081). Testele unui ecran au trecut local, dar au picat în CI pentru că mașina CI rulează în UTC; a fixat fusul orar al testelor la Europe/Bucharest și a notat practica drept PATTERN-010.
Ce am făcut cu ea: Am decis că răspunsurile de reverificat blochează publicarea (Q-079), că examinatorul trebuie să seteze data de încheiere înainte de publicare (Q-080) și că data se blochează după publicare (Q-081). Am confirmat textele noi din mock-uri.

## 2026-11-27 · Deploy-uri: întâi după CI, apoi manuale (D-063)
Unealta: Claude Code (prompt liber, un sub-agent care a citit documentația Render).
Ce am cerut (pe scurt): Ca API-ul să se deployeze doar la schimbări în backend, site-ul doar la schimbări în frontend, iar documentația deloc.
Ce am primit: Asistentul a verificat în documentația Render și în istoricul deploy-urilor că regula exista deja prin rootDir și mi-a arătat că problema reală era numărul de merge-uri (31 de deploy-uri în 5 zile) și faptul că un push cu CI roșu se deploya oricum. După primul release grupat, site-ul s-a deployat singur, dar API-ul nu, iar cele două au fost nesincronizate aproximativ 11 minute, până am făcut deploy-ul API-ului de mână. M-a întrebat dacă deploy-urile manuale contravin cerințelor și a verificat catalogul: nu contravin, dar URL-ul live trebuie să fie la zi la predare.
Ce am făcut cu ea: Am ales merge-uri grupate și deploy după CI, apoi deploy-uri manuale pentru ambele servicii, întâi API-ul și apoi site-ul (D-063). Am făcut eu deploy-urile din Render.

## 2026-11-27 · P8b: pagina de rezultate a candidatului
Unealta: Claude Code (/plan, /build, Playwright în Docker).
Ce am cerut (pe scurt): Planul și construirea paginii de rezultate (DS-005).
Ce am primit: Asistentul mi-a pus patru întrebări înainte de plan: ce vede candidatul la Subiectul I și la Subiectul II, ce încercări apar și dacă vede statistici de clasă. Mock-ul DS-005 a fost desenat și confirmat înainte de cod. Un test scris de el a picat din cauza unui tipar prea larg („mediană” dintr-un pas de barem) și mi-a spus deschis că a îngustat testul.
Ce am făcut cu ea: Am ales răspunsul corect și explicația la Subiectul I, pașii din barem cu punctajul la Subiectul II, toate încercările cu cea care contează marcată și fără statistici de clasă (Q-082–Q-085). Am aprobat planul și mock-ul și am cerut un singur release pentru P8a și P8b.

## 2026-11-27 · Review cu trei sub-agenți pe release-ul P8a + P8b
Unealta: Claude Code (trei sub-agenți în paralel: performanță, securitate, SEO și GEO).
Ce am cerut (pe scurt): Un review al PR #16 față de plan și de fișa din README.
Ce am primit: Asistentul a verificat fiecare problemă în cod înainte să mi-o raporteze. Cele mai importante: o notă se putea schimba după publicare dacă două taburi lucrau în același timp, o editare de barem se putea suprapune cu publicarea, iar răspunsurile notate cu un singur punctaj nu erau marcate când întrebarea trecea pe barem. A explicat că o cursă între două cereri nu se poate reproduce într-un singur test, așa că testele verifică ordinea blocărilor. Ulterior, două teste vechi au picat în CI din cauza vitezei mașinii; nu le-a putut reproduce local și mi-a spus asta deschis.
Ce am făcut cu ea: Am cerut reparațiile pe rând. Am decis ca răspunsurile trecute pe barem să revină la corectare și să blocheze publicarea până primesc punctaj pe pași (Q-086). Am acceptat schimbarea testelor de accesibilitate. Am cerut ca reparația testelor instabile să intre în același release și am dat merge.

## 2026-11-27 · P8c: corectarea cheii după examen
Unealta: Claude Code (/plan, /build, Playwright în Docker).
Ce am cerut (pe scurt): P8c, recalcularea Subiectului I când corectez răspunsul corect după predare (D-046).
Ce am primit: Patru întrebări înainte de plan: unde se păstrează jurnalul corecturilor, ce se mai poate schimba la variante, dacă se recalculează și formulele și dacă editorul arată câte încercări s-au recalculat. Asistentul a observat că recalcularea trebuie să blocheze încercările înaintea întrebării, ca la corectare, altfel cele două s-ar fi putut bloca reciproc. Mock-ul DS-007 a fost confirmat înainte de cod.
Ce am făcut cu ea: Am ales un jurnal salvat și afișat în editor, corectarea variantei corecte și a greșelilor de scriere dar fără reordonare, formulele în afara P8c (Q-091) și un mesaj cu numărul de încercări recalculate (Q-087–Q-090).

## 2026-11-27 · Review cu trei sub-agenți pe release-ul P8c, problemă cu problemă
Unealta: Claude Code (trei sub-agenți în paralel).
Ce am cerut (pe scurt): Același review pe PR #18, apoi să discutăm problemele separat, pas cu pas.
Ce am primit: Șapte probleme, fiecare explicată cu un exemplu și o recomandare. Prima variantă propusă pentru a doua problemă (o blocare doar pe întrebare) ar fi putut bloca reciproc două cereri; asistentul a observat asta singur și a schimbat ordinea. Două teste ale lui au picat inițial din alt motiv decât cel urmărit și le-a corectat înainte de reparație.
Ce am făcut cu ea: Am ales ca tipul și subiectul unei întrebări extrase să nu se mai poată schimba (Q-092), am cerut celelalte reparații, am lăsat neschimbată o problemă minoră (o blocare scurtă la fiecare salvare) și am clarificat acordul din INTERVIEW.md. Am dat merge și am făcut deploy-urile.

## 2026-11-28 · Recapitulare și PR-ul pentru P10, fără merge înainte de pilot
Unealta: Claude Code (prompt liber).
Ce am cerut (pe scurt): O recapitulare a ce mai e de făcut până la predare, push pentru P10 și dacă ar strica ceva un merge înainte de 1 decembrie.
Ce am primit: Lista lucrurilor rămase, cu ce depinde doar de mine (întrebările și validatorii, cu BANK.md la 0 / 60, bucket-ul R2, cron-ul, dry run-ul) și cu SUBMISSION.md lipsă. Despre merge: nu pornește niciun deploy (deploy-urile sunt manuale, D-063), P10 nu are migrații, iar candidații nu văd nimic nou; riscul real ar fi un deploy înainte de pilot, care schimbă fișiere comune (rutele, traducerile). Asistentul mi-a amintit și că planul aprobat al P10 spune explicit „nimic nu se îmbină înainte sau în timpul pilotului”.
Ce am făcut cu ea: Am cerut push pentru P10 și am ales să deschid PR-ul (#19) doar pentru CI, cu merge pe 1 decembrie, ca main să rămână exact versiunea pe care rulează pilotul.

## 2026-11-28 · Review cu trei sub-agenți pe PR-ul P10
Unealta: Claude Code (trei sub-agenți în paralel).
Ce am cerut (pe scurt): Review pe PR #19, comparat cu planul și cu fișa din README.md: performanță, securitate, SEO și GEO, doar probleme de corectitudine, cu fișier și linie.
Ce am primit: Securitatea și performanța nu au găsit probleme (analiza e doar pentru examinatorul propriu, fără date personale ale candidaților, cu un număr fix de interogări). Agentul de SEO a raportat un titlu gol pentru un item fără competență; asistentul a verificat și a arătat că publicarea refuză itemii fără competență, deci situația nu apare pe date reale, și nu a reparat-o. A semnalat ca decizie a mea faptul că analiza răspunde și pentru un examen ciornă, cu un rezultat gol, cum spun planul și docs/API.md.
Ce am făcut cu ea: Am lăsat PR-ul neîmbinat până pe 1 decembrie. Întrebarea despre examenele ciornă a rămas nehotărâtă.

## 2026-11-28 · Verificarea securității aplicației și teste pentru SQL injection
Unealta: Claude Code (prompt liber, Pest, npm audit, composer audit).
Ce am cerut (pe scurt): Dacă aplicația are vulnerabilități care trebuie reparate, apoi dacă formularele de autentificare și înregistrare sunt vulnerabile la SQL injection, și două teste Pest care să o dovedească.
Ce am primit: Asistentul a citit rutele, controlerele, încărcarea fotografiilor, motorul de formule și configurația și nu a găsit o vulnerabilitate de reparat înainte de pilot; ca îmbunătățiri ulterioare a notat token-urile fără expirare și lipsa antetelor de securitate pe site. A explicat că valorile din formulare ajung în baza de date ca parametri legați, nu lipite în SQL. Cele două teste încearcă variante de tipul `' OR '1'='1` la autentificare și un nume `Robert'); DROP TABLE users;--` la înregistrare; trec, la fel toată suita (448). `composer audit`, rulat când a pornit Docker, a găsit 5 avertismente Symfony; asistentul a explicat de ce niciunul nu atinge aplicația (nu trimite e-mailuri, nu folosește generatorul de URL-uri al Symfony) și a recomandat actualizarea pe 1 decembrie, nu înainte de pilot.
Ce am făcut cu ea: Am cerut testele. Sunt comise local pe ramura test/auth-sql-injection, fără push, și intră în release-ul de pe 1 decembrie, împreună cu actualizarea Symfony.

## 2026-11-28 · Verificarea autentificării de un sub-agent de securitate
Unealta: Claude Code (un sub-agent).
Ce am cerut (pe scurt): Un inginer de securitate care să valideze logica de autentificare.
Ce am primit: Două probleme reale: limita de 5 încercări greșite pe minut poate fi ocolită cu un antet X-Forwarded-For fals (reprodusă local, pe Render neverificat) și nu există o limită doar pe e-mail; iar timpul de răspuns arată ce e-mailuri au cont (17 ms față de 172 ms), deși C-001 promite același răspuns. Plus două probleme minore. Asistentul a verificat în codul framework-ului că `trustProxies('*')` are încredere în cine apelează. Restul (revocarea token-urilor, parola temporară, dezactivarea, delogarea) e corect. A semnalat ca întrebare pentru mine că un administrator poate seta parola altui administrator, lucru permis de D-054.
Ce am făcut cu ea: Am întrebat ce ar însemna să le repar înainte de pilot (plan, deploy duminică, dry run refăcut, risc pe autentificare chiar înainte de pilot) și am decis să rămână pentru release-ul de pe 1 decembrie. Limita pe e-mail va veni ca propunere de schimbare a C-001.

## 2026-11-28 · Bucket-ul Cloudflare R2 pentru fotografiile de la Subiectul II
Unealta: Claude Code (prompt liber, o comandă de test în Docker).
Ce am cerut (pe scurt): Pașii pentru R2, apoi lămuriri la fiecare pas: token de cont sau de utilizator, dacă setarea cheilor în Render e sigură, ce înseamnă mesajul Render despre OIDC, ce buton aleg la salvare și dacă testul local e sigur.
Ce am primit: Pașii pentru bucket (privat, fără CORS, numele din render.yaml), token (cont, Object Read & Write, doar pe bucket) și variabilele din Render. Asistentul mi-a spus să nu-i dau cheile în chat. Verificând dacă pasul 3 e sigur, a găsit în cod că o scriere refuzată de R2 nu dă eroare (`Photos.php:71`, cu `'throw' => false`), deci cheile trebuie testate înainte de pilot. A spus deschis că nu știa ce commit redeploy-ează Render și a verificat în deploy-urile GitHub că e chiar main (dd0b2f0). Mesajul OIDC al Render e pentru AWS, nu pentru R2. „Save only” nu aplică cheile, pentru că API-ul își pune setările în cache la pornire. Nu a creat un candidat de test pe site-ul live, ca să nu adauge date false lângă cele din pilot. M-a avertizat că în backend/.env existau deja rânduri AWS goale, care ar fi câștigat în fața celor adăugate la final.
Ce am făcut cu ea: Am creat bucket-ul și token-ul, am pus cheile în Render cu „Save and deploy” și în backend/.env pentru test. Testul a scris, a citit și a șters un fișier în bucket. Verificarea completă, o fotografie încărcată în dry run, rămâne pentru mâine. Problema scrierii fără eroare intră pe lista de pe 1 decembrie.
