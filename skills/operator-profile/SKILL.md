---
name: operator-profile
description: >-
  Day-zero personalization for any AI OS. Runs a structured interview and
  writes PROFILE, agent-interface, and non-negotiables files under memory/.
  Triggers: operator profile, personalize my AI, who am I setup, identity
  interview, calibrate how you talk to me. Do not use for session wrap-up
  (memory-loop) or optimization scans (superninja).
---

# operator-profile

**When to use:** first hour with a new AI setup, or when prefs/identity drift and need a refresh.

**When not to use:** mid-task memory updates (`memory-loop`); MP/QP audits (`superninja`).

## Intent / Done / Boundaries

1. **Intent** — capture how the operator works so every future session starts personalized.
2. **Done** — `memory/PROFILE.md`, `memory/agent-interface.md`, and `memory/non-negotiables.md` exist, pass `lint-profile.js`, operator approved the draft.
3. **Boundaries** — draft first; no silent overwrite on CONFLICT; no secrets in Git memory; sensitive facts stay local notes only (never PROFILE).

## Procedure

1. Confirm you read this file. Restate Intent / Done / Boundaries.
2. If `memory/PROFILE.md` is missing, copy from `templates/memory/PROFILE.template.md` (and sibling templates) — **placeholders only until interview fills them**.
3. Load `references/interview-deck.md`. Ask **3 questions per turn** (9 core questions total unless the operator says continue).
4. Skip questions already answered in existing PROFILE — name what you are skipping.
5. After each turn, **draft** updates to the three memory files. Show diff summary; wait for approval before write.
6. On CONFLICT (new answer contradicts PROFILE): surface both versions; do not pick a winner silently.
7. After core deck: offer **continuous mode** — adaptive gap questions using the same draft → approve → write loop.
8. Run `node skills/operator-profile/scripts/lint-profile.js --dir memory` before calling Done.
9. Remind operator to run `memory-loop` at session end and `superninja` weekly once the OS is in use.

## Progressive disclosure

- Interview questions: `references/interview-deck.md`
- File shapes: `templates/memory/*.md`
- Host install: `PORTABLE.md`

## Failures to refuse

- Writing secrets, tokens, SSNs, or recovery codes into `memory/`
- Silent PROFILE overwrite when operator did not approve
- Inventing preferences the operator did not state
- Treating interview output as canonical without lint pass

## Verify

```bash
node skills/operator-profile/scripts/run-acceptance.js
```
