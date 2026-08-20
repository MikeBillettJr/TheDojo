# Memory loop — portable install

## Cursor

1. Copy `skills/memory-loop/` to `~/.cursor/skills/memory-loop/`.
2. Ensure `memory/WORKING.md` exists (from `templates/memory/WORKING.template.md`).
3. End sessions with: **“wrap up”** or **“end session”**.

## Claude Code

Keep `memory/` at repo root. Agent loads `WORKING.md` at session start per your `AGENTS.md`.

## Generic chat

Paste `SKILL.md` into instructions. Maintain `WORKING.md` and `LESSONS.md` as plain files you paste at session start.

## Lint after every write-back

```bash
node skills/memory-loop/scripts/lint-memory.js --dir memory
```

## Triggers

| Phrase | Action |
|--------|--------|
| wrap up / end session / close session / session complete | Full wrap-up procedure |
| stop / pause / wait | **Not** wrap-up — halt current task only |
| (non-trivial task completed) | Write-back per skill procedure |
