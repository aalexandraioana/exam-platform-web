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
