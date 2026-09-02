---
name: inspect-os
description: >-
  Door B for an existing AI setup: read-only inventory of AGENTS.md, memory
  files, skills, and rules; gap card vs TheDojo trio; recommend-only merge
  plan. Triggers: I already have a setup, inspect my OS, Door B, don't start
  from scratch, I already have Cursor or Claude memory. Do not use for first
  visit (enter-the-dojo / WELCOME), blank-slate identity interview
  (operator-profile / LAUNCH), superninja, connector mapping, or career
  packaging.
---

# inspect-os (Door B)

**When to use:** the operator already has an AI OS (or thinks they do) and wants a renovation, not a tutorial. Phrases: “I already have a setup”, “inspect my OS”, “Door B”, “don’t start from scratch”.

**When not to use:**
- First visit / **Enter the dojo** / TheDojo GitHub URL → `enter-the-dojo.js` or `docs/WELCOME.md`, then wait.
- Truly blank tree → Door A: `docs/LAUNCH.md` + `operator-profile`. Do **not** run the identity interview under this skill.
- Weekly MP/QP scan → `superninja`. New skill → `factory-intake`. MCP wiring → `connector-map`. Job hunt → `career-loop`. Belts → `dojo-belts`.

## Intent / Done / Boundaries

1. **Intent** — see what they already have; show gaps vs TheDojo trio (operator-profile, memory-loop, superninja).
2. **Done** — inventory JSON + gap card + recommend-only merge plan shown; operator picks named next writes.
3. **Boundaries** — read-only. **Never overwrite** PROFILE, skills, or rules. Draft merge only. Secrets → `[REDACTED]` / omit.

## Procedure

1. If this is a first visit, run welcome (`enter-the-dojo.js` / WELCOME) and wait. Do not skip welcome to inspect.
2. Confirm you read **this** file. Restate Intent / Done / Boundaries.
3. Run the scanner (do not rebuild it in chat):

```bash
node skills/inspect-os/scripts/inspect-os.js --root <their-os-folder>
```

4. Show the gap card (kind, found, gaps, merge_plan). `recommend_only` until they name a file + action.
5. If `kind` is `blank_slate`, route to Door A (`LAUNCH.md` + `operator-profile`). Stop. No interview here.
6. Do not write `memory/` or `skills/` unless they explicitly approve a **named** add that does not overwrite.

Load `references/scan-map.md` only if you need the file list. Host install: `PORTABLE.md`.

## Failures to refuse

- Overwriting existing PROFILE / skills / AGENTS.md
- Running operator-profile interview on a blank tree under this skill
- Skipping WELCOME / enter-the-dojo on first visit
- Echoing API tokens or private keys — redact
- Auto-applying the merge plan
- Treating this as connector mapping or career packaging
- Inventing files that the scanner did not find (`could_not_verify`)

## Verify

```bash
node skills/inspect-os/scripts/run-acceptance.js
```
