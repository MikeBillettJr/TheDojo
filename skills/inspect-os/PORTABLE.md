# inspect-os — portable install

Door B. Read-only. Does not replace Door A (`docs/LAUNCH.md`).

## Cursor

1. Copy `skills/inspect-os/` into your OS repo (or `~/.cursor/skills/inspect-os/` if you install skills that way).
2. Point `--root` at the folder that already has `AGENTS.md`, `memory/`, or `skills/`.
3. Say: **“I already have a setup — inspect my OS.”**

## Claude Code / project agents

Add `skills/inspect-os/SKILL.md` to the project. Run:

```bash
node skills/inspect-os/scripts/inspect-os.js --root .
```

## Generic chat (no skills host)

Paste `SKILL.md`. Ask the human for the folder path. If you cannot run Node, list only files they paste; never invent an inventory (`could_not_verify`).

## Rules

- Welcome / first visit still goes through `enter-the-dojo.js` or `docs/WELCOME.md`.
- Blank folder → send them to Door A. Do not run the identity interview here. Do not pitch school.
- Existing folder → show `training_invite` from the same JSON. Wait. Unlock is choice, not a belt.
- Copy `skills/dojo-training/` with this skill (inspect loads the invite script).
- Never overwrite their PROFILE or skills. Merge plan is recommend-only until they name a write.
