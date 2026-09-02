# factory-intake — portable install

How a new skill enters an OS: spec → tests → ship. Not a prompt dump.

## Cursor

1. Copy `skills/factory-intake/` into your OS repo (or `~/.cursor/skills/factory-intake/`).
2. Say: **“Build a new skill”** / **“factory intake”**.
3. The agent shows a spec card and waits. After you approve, it stages a candidate and runs:

```bash
node skills/factory-intake/scripts/skill-gate.js --skill <name> --candidate <staged-SKILL.md> --no-write
```

The gate never writes `skills/`. `--write` / `--apply` / `--live` abort.

## Rules

- Spec before any write.
- Candidate rejected → do not copy live.
- Your private forge stays private. Do not commit secrets, packets, or local paths.
