# R-16 model-challenges addendum — Aetolian League + Maurya (278 BCE)

**Status: Proposal (2026-10-14), part of R-16.** Supplement to [`r16-model-challenges.md`](r16-model-challenges.md). Evidence only; no architecture changes, AD-25 remains **OPEN**.

Sources: [`r16-aetolian-league-278bce.md`](r16-aetolian-league-278bce.md) (§M, taxonomy test), [`r16-maurya-278bce.md`](r16-maurya-278bce.md) (§M, taxonomy test).

## Test outcomes vs F1–F7, role kinds, RV1–RV4

| Aspect | Aetolian League (278 BCE) | Maurya Empire (278 BCE) | Verdict |
|---|---|---|---|
| **Family** | **F3 — Federal league / *koinon*** | **F2 — Royal (personal) monarchy** | Consistent with taxonomy. No new family required. |
| **Seven role kinds** | Political office, Military command, Administrative appointment present; Religious office limited/uncertain at 278 (gap). | Political office, Military command, Religious office, Administrative appointment present; Social rank present; Property/landholding contextually present; Institutional membership present (advisory). | All seven kinds sufficient; no new role kind required. Gaps are **evidence uncertainty**, not missing kinds. |
| **RV1 (indirect influence/hegemony)** | **Strongly supported.** Member communities = hegemonic-indirect (federation without direct administration of internal government). | **Strongly supported.** Core = direct administration; peripheral tributaries/tribal areas = hegemonic-indirect (suzerainty with retained internal rule). Spectrum fits §6.1. | Taxonomy §6.1 holds for both (non-Mediterranean + federal). |
| **RV2 (obligations/privileges)** | Military levy + alignment obligations vs. internal autonomy/own magistrates. Evidence partial at 278. | Land tax, tribute, military contributions as obligations vs. retained internal rule for tributaries as privilege. | Vocabulary (§6.2) is sufficient and general (not Rome-specific). |
| **RV3 (tiered/grantable/local membership)** | **Supported (nested).** Two-level (community + league); federal *politeia* attested later (uncertain at 278). Requires scoped/tiered model without forcing single flag. | **Test case: subjecthood.** No electoral franchise; subjects with obligations, minimal political rights. Must represent subject tiers (not citizens). | RV3 must accommodate both **electoral/nested membership** (federal) and **non-electoral subject tiers** (imperial monarchy). Architecture must not assume Roman-style citizenship. |
| **RV4 (four dimensions separate)** | Legal authority (corporate bodies), political influence (member autonomy varies), geographic control (decentralised), economic obligations (contributions) — distinct. | Legal authority (king+delegates), political influence (elites/factions), geographic control (distance-dependent), economic obligations (tax/tribute) — distinct. | Confirms separation (§6.4); especially critical for distance-dependent imperial control. |
| **Corporate grant (N1)** | **Assembly/council as corporate grantors** (elect magistrates, pass decrees). | **Individual sovereign grantor** (king appoints). | Both represented (corporate vs. unilateral). No contradiction. |
| **Families compose (RV0)** | **F3 alone** (no monarchy head) — clean. | **F2 alone** — clean. | Confirms combinations exist (Epirus F3+F2) but not required here. |

## Key challenges identified (proposals only)

| # | Challenge | Evidence | Recommendation (to AD-25, proposal only) |
|---|---|---|---|
| **T1** | **Evidence uncertainty at 278 BCE.** Aetolian: later inscriptions back-projected; Maurya: Bindusara vs. Ashokan sources, *Arthashastra* composite. | Both sheets mark extensive **Uncertain / gap**. | Architecture must tolerate **Uncertain / gap** states (content, not forced closure). Research discipline requires explicit gaps. |
| **T2** | **RV3 must cover non-electoral subjecthood.** Maurya shows subjects (minimal rights) vs. Aetolian nested citizens. | J.1 sections differ fundamentally. | RV3’s attribute set (political rights/civil privileges/civic obligations/military obligations/office eligibility/applicable legal order) must allow **zero political rights** while having obligations — confirms separate storage. No change to model, just confirms generality. |
| **T3** | **Geographic control varies with distance.** Maurya provincial autonomy increases with distance (communication limits). | Maurya §K shows formal authority vs. practical control gap. | RV4 (dimension separation) essential — legal authority ≠ geographic control. Mirrors ADR-0020. |
| **T4** | **Formal vs. practical deference (C9).** Aetolian council/apokletoi gain practical weight due to infrequent assembly. | Aetolian §K. | Must distinguish formal competence from conventional/practical weight (influence) — already in §4.1/§4.2. |
| **T5** | **Dual kinds per holding.** Aetolian strategos (political+military), Mauryan king (political+military+religious). | Both cleanly fit. | Confirm multiple kinds per RoleDefinition/holding are allowed (generalisation of existing model). |
| **T6** | **Advisory vs. decisive bodies.** Mauryan *Mantriparishad* advisory only; Aetolian council corporate with agenda-setting power. | Different. | Model must distinguish **advisory** (influence) from **decision-making with concurrence** (legal authority) — content distinction. |

## Taxonomy sufficiency assessment

**Sufficient.** The proposed institutional taxonomy (F1–F7), seven role kinds, and RV1–RV4 are **sufficient** to represent both polities at 278 BCE **without forcing Mediterranean terminology**.

- **No new family required.** F3 and F2 cover cleanly.
- **No new role kind required.** All cases map to existing seven kinds.
- **RV1–RV4 generalise well.** Indirect hegemony, obligation/privilege vocabulary, scoped/tiered membership (including subjecthood), and four-dimension separation all hold outside the Mediterranean set.
- **Highest value confirmations:** RV3’s generality (electoral + subject tiers), RV4’s distance-dependent control, and N1 (corporate vs. unilateral grant) are validated.

**Recommendation:** **Extend? No. Deepen? No. Remain sufficient.** The taxonomy needs **no extension and no deeper architectural revision** at this point. The gaps are **evidence uncertainty** (chronological) and **content schema detail** (how to record tiers/membership attributes) — both are **research/schema questions**, not fundamental architectural flaws. AD-25 should remain **OPEN**; adopt RV1–RV4 vocabulary as proposed (§6.1–§6.4) when deciding the schema, but no code/VS5 changes.
