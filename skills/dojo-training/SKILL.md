---
name: dojo-training
description: >-
  Invitation-only next-lesson card after a dojo door. Triggers: continue dojo
  training after door, next operator kata invite, Door A profile done invite,
  Door B inspect training invite. Do not use on first visit, look around, or
  to dump a 101-501 catalog before a door is Done.
---

# dojo-training

**When to use:** Door A operator-profile is Done, or Door B inspect-os just produced a gap card, or the operator says continue training after a door. Run the invite script. Show 0–2 next katas. Wait for them to pick.

**When not to use:**
- First visit / Enter the dojo / look around → welcome, then wait. Do not pitch school.
- “What lessons exist?” before a door is Done → send them through a door. Do not dump 101–501.
- Scoring belts / AI IQ → `dojo-belts` (kit seal only until invited).
- Teaching the pieces → `os-101` only **after** this invite (or a later invite) names it.

## Intent / Done / Boundaries

1. **Intent** — after setup, invite the next growth. Setup is not knowledge.
2. **Done** — JSON invite card: `practiced` (file hint), `next` (0–2 ids), `unlock: choice`, `exam_required: true`, `wrote: false`. Operator picks or skips.
3. **Boundaries** — never print the full ladder. Practiced ≠ passed. Unlock is **choice**, not belt credit. Read-only. Do not write the operator’s private memory.

## Procedure

1. Confirm you read **this** file. Restate Intent / Done / Boundaries.
2. If this is a first visit, run welcome and wait. Stop.
3. Run (do not rebuild in chat). Door B inspect now **embeds** the invite — you do not wait for them to ask:

```bash
node skills/inspect-os/scripts/inspect-os.js --root <their-os-folder>
```

Door A after profile lint PASS:

```bash
node skills/dojo-training/scripts/after-door-a.js
```

Cold clone / first visit:

```bash
node skills/dojo-training/scripts/invite-training.js --mode cold
```

4. Show `practiced` as “files look practiced,” not “you earned this belt.” Show `next` only. Wait.
5. If they pick 101 and later pass it, run:

```bash
node skills/dojo-training/scripts/invite-training.js --mode after_101
```

Show 201 only. Wait. Do not list 301, 401, or 501.
6. If they pick a named next kata (example: 101 or 201), then load that skill. Do not auto-run.

Load `references/invite-map.md` only if the mapping is unclear.

## Failures to refuse

- Dumping 101–501 as a catalog
- Awarding a belt because PROFILE or WORKING exists
- Inviting school on first visit / look around
- Writing memory/skills without a named pick
- Echoing tokens (`sk-…`, `ghp_`)

## Verify

```bash
node skills/dojo-training/scripts/run-acceptance.js
```
