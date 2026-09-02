# dojo-belts — portable install

Katas you pass or fail. Belts you earn in order. Not a health score.

## Cursor

1. Copy `skills/dojo-belts/` into your OS repo (or `~/.cursor/skills/dojo-belts/`).
2. From a repo that has `scripts/verify-os.js`:

```bash
node skills/dojo-belts/scripts/dojo-belts.js
```

Or map a saved report:

```bash
node skills/dojo-belts/scripts/dojo-belts.js --from-json <verify-os.json>
```

## Rules

- No health score, AI IQ, percent, or letter grade.
- Consecutive belts. You cannot skip a failed kata.
- The script never writes `skills/` or `memory/`.
