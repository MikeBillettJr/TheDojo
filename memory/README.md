# Memory

Your **live** operator state. On first launch, copy files from `templates/memory/` (see `docs/LAUNCH.md`).

| File | Skill | Purpose |
|------|-------|---------|
| `PROFILE.md` | operator-profile | Role, goals, prefs |
| `agent-interface.md` | operator-profile | How agents talk to you |
| `non-negotiables.md` | operator-profile | Hard lines |
| `WORKING.md` | memory-loop | Focus + open loops (~30 lines) |
| `LESSONS.md` | memory-loop | Dated prefer/when bullets |
| `optimization/` | superninja | MP/QP catalogs (shipped with repo) |

**Do not** store secrets, tokens, or Restricted data here. Use local encrypted notes for sensitive facts.

Lint after writes:

```bash
node skills/operator-profile/scripts/lint-profile.js --dir memory
node skills/memory-loop/scripts/lint-memory.js --dir memory
```
