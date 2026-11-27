# Open questions · UI and language

> Entries of [OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md) (the index and the rules). IDs never change.


## Q-015 · Which language is the UI in?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Romanian and English, with a language toggle. CONTEXT.md gets a Romanian and an English column per term; the Romanian words themselves are open (Q-017).

## Q-017 · Which Romanian and English UI words map to each CONTEXT.md term?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Formal, exam-style Romanian mirroring the English terms: Examen, Candidat, Examinator, Administrator, Încercare, Predare, Subiectul I / II, Punct din oficiu, Variantă, Analiza itemilor, Perioadă de toleranță, Clasă, Item (blueprint slot). Avoid in Romanian UI: test, testare, lucrare, cadru didactic, profesor. Recorded in CONTEXT.md.

## Q-032 · How is mathematical notation shown in question text?
- **Status:** answered
- **Date:** 2026-11-22
- **Blocks:** P4b (question bank), P7 (exam room)
- **Context:** Plain text with JetBrains Mono (DESIGN.md `font-math`), or rendered notation such as KaTeX (a new dependency).
- **Answer:** Plain text in JetBrains Mono (DESIGN.md `font-math`), with Unicode symbols typed in the text (∢, °, ², ·, :, ≤); no rendering library. (Answered 2026-11-24.)
