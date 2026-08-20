# Contributing to TheDojo

Thank you for helping ship **proven** agent skills.

## How skills enter this repo

1. **Forge privately** — prove the skill on real work with acceptance tests.
2. **Export** — follow [SANITIZATION.md](SANITIZATION.md); genericize paths and names.
3. **Verify** — `node skills/<skill>/scripts/run-acceptance.js` → `"pass": true`.
4. **PR** — include skill name, SIS level, test command, and what was deliberately omitted.

## Skill structure

Mirror `skills/superninja/`:

```
skills/<kebab-name>/
  SKILL.md           # contract (~200 lines max)
  PORTABLE.md        # optional: non-Cursor install
  references/        # lazy-loaded depth
  scripts/           # optional Node helpers (no npm deps preferred)
```

## Quality bar

- Binary acceptance tests (3–19 checks minimum for scripted skills)
- `recommend_only` for optimization/investigation skills
- No invented metrics, health scores, or token counts
- MP/QP citations when recommending optimizations

## Code of conduct

Be precise, honest about `could_not_verify`, and respect that operators — not agents — approve irreversible actions.
