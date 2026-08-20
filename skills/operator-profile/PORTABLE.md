# Operator profile — portable install

## Cursor

1. Copy `skills/operator-profile/` to `~/.cursor/skills/operator-profile/` (or keep inside your OS repo).
2. Copy `templates/memory/*` → `memory/` on first setup (see `docs/LAUNCH.md`).
3. Say: **“Run operator profile — identity interview.”**

## Claude Code / project agents

Add `skills/operator-profile/SKILL.md` to your project. Point the agent at `memory/` relative to repo root.

## Generic chat (no skills host)

1. Paste `SKILL.md` + `references/interview-deck.md` into custom instructions.
2. Create the three memory files manually from `templates/memory/`.
3. Run lint locally after each approved write:

```bash
node skills/operator-profile/scripts/lint-profile.js --dir memory
```

## Output files

| File | Holds |
|------|--------|
| `memory/PROFILE.md` | Role, goals, context |
| `memory/agent-interface.md` | Tone, pace, teaching level |
| `memory/non-negotiables.md` | Hard lines and tradeoffs |

Never put secrets or Restricted data in these files.
