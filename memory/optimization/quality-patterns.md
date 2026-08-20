# Quality-patterns — correctness

These are how agents ship confident wrong answers. Scan **before any batch or any number that will be seen by a human**.

Domain-specific rules from the original system are omitted. What remains is portable to any warehouse, CRM, ticket system, or operator API.

**Rule of thumb:** if you cannot name the system of record and the freshness, you do not have a number.

---

### QP-1 — Wrong-tier source
Real-time question answered from a warehouse (hours of lag) or a cache. Historical question hammering a live API.
**Fix:** a three-tier map — (0) origin/live, (1) analytics warehouse, (2) derived/cache — and a routing line in `personal-os.mdc` / source map when you have one.

### QP-2 — Stale denominator
A rate whose denominator is last week’s snapshot or a filtered subset that quietly dropped rows.
**Fix:** denominator from the same SoT and time window as the numerator. If you can’t prove it, don’t publish the rate.

### QP-3 — Classification boundary drift
“Tier A” in the prompt does not match the code/definition (off-by-one, inclusive/exclusive, AND vs OR).
**Fix:** one definition file. Re-apply it in the critic before ship. Judges must use *that* definition.

### QP-4 — Missing validation pass
See MP-7. Batch of labels/metrics with no programmatic re-check.

### QP-5 — Assumed identifier
Column, field, or enum from memory. Zero rows or a silent wrong join.
**Fix:** catalog/schema lookup first. Preflight blocks known-bad names. Zero-count on a guessed id is a **red flag**, not “no data.”

### QP-6 — Freshness-first + zero-result skepticism
Empty result treated as ground truth.
**Fix:** empty + “I used the live API” is OK. Empty + guessed table/id is not. Say `could_not_verify` when the source is wrong or down.

### QP-7 — Ship-verification on a proxy
“Tests passed on staging” or “the draft looks right” used as proof the production artifact is correct.
**Fix:** verify the thing that actually shipped (the message, the row, the URL, the ticket).

### QP-8 — Positive-control tool test
Designed a flow on a tool you have never called successfully with a known-good id.
**Fix:** one successful call first. Catalog presence ≠ populated field.

### QP-9 — Cloned code inherits latent bugs
Copied a working module; inherited a filter/join that was already wrong.
**Fix:** when you clone, re-run the critic on the *assumptions*, not just the new feature.

### QP-10 — Schema presence ≠ cohort density
INFORMATION_SCHEMA / docs say the column exists. In the population you care about it is 99% NULL.
**Fix:** “exists ≠ populated.” A query that returns real rows for the cohort, or you don’t use the field.

### QP-11 — Mapping ≠ wiring
A beautiful map/skill says how the system works; the live path (flag, env, wrapper) is different.
**Fix:** mesh: validate on a different modality (live call / UI) than the doc you just edited.

### QP-12 — Wrapper-signature drift
MCP/tool wrapper arguments don’t match the underlying API (renamed field, extra required, auth scope).
**Fix:** schema fetch (`get_tool_schema`) on first use after a deploy; don’t cache signatures across weeks without a fingerprint.

### QP-13 — Stub data to bypass gates
Fake rows so the pipeline “succeeds.”
**Fix:** gates fail closed. Never invent a passing fixture that production cannot produce.

### QP-14 — Unbounded range filters
`created > X` with no upper bound; you silently include the future or the next cycle.
**Fix:** bound both sides. Know whether the bound is inclusive.

### QP-15 — Default-route-without-evidence
Unknown → “the usual bucket” (default team, default template, default SQL).
**Fix:** unknown → `PARTIAL` / human. Defaults hide the interesting failures.

### QP-16 — Agent output not persisted
The answer lived in chat. Compaction / a new session deleted it. The team cannot audit.
**Fix:** session log, eval jsonl, or a doc. Wrap-up is a feature, not etiquette.

### QP-17 — Duplicate production paths
Two senders, two queries, two UIs for the same action. Drift is guaranteed.
**Fix:** one canonical path. The other is marked legacy and blocked in preflight.

### QP-18 — Self-locking stale cache
Cache never invalidates; fingerprint doesn’t include the file that changed.
**Fix:** cache key = hash of sources. Miss → rebuild. Unreachable source → don’t serve yesterday as today.

### QP-19 — Stale profile / recipient data
Delivery-adaptation or routing using a month-old profile.
**Fix:** freshness stamp on profiles. Low confidence → subtle or skip.

### QP-20 — Magic-string equality on event fields
`status == "done"` when production uses `DONE`, `complete`, or a nested enum.
**Fix:** normalize via a table from the live API, not a string you remember.

---

## Pre-ship checklist (batch)

- [ ] Source tier matches the question (QP-1)
- [ ] Denominator named and same window (QP-2)
- [ ] Labels re-checked against the definition (QP-3 / QP-4)
- [ ] Identifiers not guessed (QP-5); empty results treated skeptically (QP-6)
- [ ] Verified on the production artifact (QP-7)
- [ ] Tool positive-controlled if new (QP-8)
- [ ] No stubbed success (QP-13)
- [ ] Output persisted (QP-16)
