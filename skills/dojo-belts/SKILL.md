---
name: dojo-belts
description: >-
  Map passing OS tests to consecutive belts and named katas. Triggers: what
  belt am I, run the katas, earn a belt, belt check, prove I got good. Do
  not use for first-visit welcome, health scores, AI IQ, superninja, or
  factory-intake.
---

# dojo-belts

**When to use:** “what belt am I”, “run the katas”, “earn a belt”, “belt check”, prove getting good with tests.

**When not to use:** Enter the dojo / WELCOME (first visit); health score / AI IQ; weekly waste scan (`superninja`); new skill (`factory-intake`); career packaging (`career-loop`).

## Intent / Done / Boundaries

1. **Intent** — show which katas PASS and the highest consecutive belt earned.
2. **Done** — JSON card from `dojo-belts.js`: `belt`, `earned`, `next`, `katas`. No health score.
3. **Boundaries** — read-only. The script never writes `skills/` or `memory/`. No invented AI IQ, percent, or letter grade. Missing verify JSON → `could_not_verify`.

## Procedure

1. Confirm you read **this** file. Restate Intent / Done / Boundaries. Load `references/belt-map.md` for the ladder.
2. If this is a first visit, run welcome and wait. Do not skip WELCOME to award a belt.
3. Run (do not invent a score in chat):

```bash
node skills/dojo-belts/scripts/dojo-belts.js
```

Or map a saved `verify-os.js` report:

```bash
node skills/dojo-belts/scripts/dojo-belts.js --from-json <verify-os.json>
```

4. Show the card. Belts are consecutive: a failed kata blocks every belt above it.
5. `--write` / `--apply` / `--live` abort.

## Failures to refuse

- Health scores, AI IQ, percents, or letter grades
- Awarding green/brown/black when a lower kata failed (no skip)
- Claiming a belt without running the script (or a saved verify JSON)
- Writing PROFILE / skills from this skill
- Skipping first-visit welcome to “rank” someone

## Verify

```bash
node skills/dojo-belts/scripts/run-acceptance.js
```
