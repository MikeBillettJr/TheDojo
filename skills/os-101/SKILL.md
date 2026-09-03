---
name: os-101
description: >-
  Invitation-only kata: name skill, script, workflow, MCP, API, key, and
  secret; never leak tokens into memory or chat. Triggers: invited os-101
  names and secrets kata, continue training with 101 after a door. Do not
  use on first visit, before a dojo-training invite, or to save keys in
  PROFILE.
---

# os-101

**When to use:** `dojo-training` named 101 as a next kata and the operator said yes. Or they already accepted a Door A invite.

**When not to use:**
- First visit / Enter the dojo / look around / cold clone “run 101”
- Before an invite card names 101
- Saving API keys into memory (`hard-04`) — refuse; host secret store / env only
- Connector wiring (`connector-map`) or wrap-up (`memory-loop`) as a substitute for this exam

## Intent / Done / Boundaries

1. **Intent** — the operator can name the pieces and keep secrets out of Git/memory/chat.
2. **Done** — script JSON labels each artifact; stdout omits tokens; `wrote: false`; save-key mode refuses.
3. **Boundaries** — invitation-only. Never echo tokens. Never write PROFILE. Do not write the operator’s private memory.

## Procedure

1. Confirm you read **this** file. Restate Intent / Done / Boundaries.
2. If they were not invited, run `dojo-training` `--mode cold` (or send them through a door). Stop.
3. Run:

```bash
node skills/os-101/scripts/os-101.js --root <folder>
```

4. Teach from the JSON labels + glossary. Do not paste file bodies that may contain secrets.
5. If they say “save this API key in memory”:

```bash
node skills/os-101/scripts/os-101.js --root <folder> --mode save-key
```

Refuse. Point at the host secret store. Do not write memory.

Load `references/glossary.md` only when teaching the names.

## Failures to refuse

- Running for a cold clone / first visit
- Printing the raw token
- Writing the token into PROFILE / WORKING / LESSONS
- Treating file presence as a passed belt
- Dumping later lessons (201–501) as a catalog

## Verify

```bash
node skills/os-101/scripts/run-acceptance.js
```
