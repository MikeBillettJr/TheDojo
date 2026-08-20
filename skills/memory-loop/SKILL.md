---
name: memory-loop
description: >-
  Persistent memory loop for any AI OS: WORKING open loops, LESSONS write-back,
  and wrap-up ritual so the next session continues instead of rebooting. Triggers:
  wrap up, end session, remember this, update working memory, write-back. Do not
  use for day-zero identity interview (operator-profile) or MP/QP scans (superninja).
---

# memory-loop

**When to use:** after non-trivial work (write-back); at session end (`wrap up`, `end session`, `close session`, `session complete`).

**When not to use:** user says **stop / pause / wait** (halt action, keep chat open — not wrap-up). Day-zero setup (`operator-profile`).

## Intent / Done / Boundaries

1. **Intent** — persist what matters; prune what is done; never poison memory with fiction.
2. **Done** — `WORKING.md` reflects reality (~30 lines); optional `LESSONS.md` append; operator told which files changed.
3. **Boundaries** — no secrets in memory files; no inventing completed work; candidates ≠ facts until operator approves PROFILE edits.

## Where to write

| What | File | Rule |
|------|------|------|
| Current focus / open loops | `memory/WORKING.md` | Rewrite; ~30 lines max |
| Durable prefer/when | `memory/LESSONS.md` | Append `## YYYY-MM-DD` + 1–3 bullets |
| Stable identity | `memory/PROFILE.md` | Rare; use `operator-profile` or explicit approval |

## Procedure — write-back (any non-trivial task)

1. Load `memory/WORKING.md` (create from `templates/memory/WORKING.template.md` if missing).
2. Update open loops: mark done, delete completed, add new if needed.
3. If reusable lesson: append to `LESSONS.md` (`Prefer X when Y`).
4. Run `node skills/memory-loop/scripts/lint-memory.js --dir memory`.
5. Tell the operator which files changed (names only).

## Procedure — wrap-up (session end)

1. Confirm you read this file. Restate Intent / Done / Boundaries.
2. Review what **actually** shipped or was decided — do not invent.
3. Refresh `WORKING.md` — Focus line = real next priority; prune to cap.
4. Append `LESSONS.md` only if something durable was learned (0–3 bullets).
5. Run `lint-memory.js`.
6. Output **3–6 bullet session summary**: shipped, open, next.
7. Name memory files touched.

## Failures to refuse

- Wrap-up on **stop / pause / wait**
- Inventing work, lessons, or closed loops that did not happen
- WORKING bloat past ~30 lines without pruning
- Storing secrets, tokens, or raw private dumps in `memory/`
- Silent PROFILE overwrite

## Verify

```bash
node skills/memory-loop/scripts/run-acceptance.js
```
