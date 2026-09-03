# os-101 — portable install

Invitation-only kata. Name the pieces. Do not leak secrets.

## Cursor

Copy `skills/os-101/` into the OS repo (or `~/.cursor/skills/os-101/`).

Only after `dojo-training` names 101 and the operator says yes:

```bash
node skills/os-101/scripts/os-101.js --root <folder>
```

If they ask to save a key in memory:

```bash
node skills/os-101/scripts/os-101.js --root <folder> --mode save-key
```

## Rules

- Do not run on first visit.
- Never print tokens. Never write PROFILE.
- File presence is not a passed belt.
