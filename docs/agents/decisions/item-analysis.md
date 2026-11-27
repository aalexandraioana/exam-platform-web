# Decisions · Item Analysis

> Entries of [DECISIONS.md](../DECISIONS.md) (live) and [DECISIONS-SUPERSEDED.md](../DECISIONS-SUPERSEDED.md) (never obeyed; kept to explain old code). IDs never change.


## D-047 · Weak-item thresholds
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** Difficulty p = average score / maximum score (Subject II uses partial scores). Discrimination = correlation between the item score and the rest of the exam score (corrected item-total). An item is weak if p < 0.20 or p > 0.90, or discrimination < 0.20; negative discrimination is flagged as a likely faulty question. A distractor chosen by fewer than 5% of Candidates is flagged unused. With fewer than 2 Attempts, or no variation in the answers, the item shows "not enough data" instead of a value. Item Analysis groups by the Examiner's competences (D-039) and reports per question and per Item (D-043).
- **Why:** The catalog requires weak items to be flagged, degenerate cases handled (everyone correct, one student) and at least one weak item found in the pilot.
- **Rejected:** Flagging on discrimination only; stricter thresholds (p < 0.30 or > 0.80, discrimination < 0.30).
- **Evidence:** docs/agents/questions/item-analysis.md:Q-031; catalog-de-proiecte-web.md:907, 916
- **Source:** user · confidence high
