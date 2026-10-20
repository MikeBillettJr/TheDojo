# Contributing to TheDojo

Thank you for helping ship **proven** agent skills.

TheDojo exists to bridge a gap: curiosity is everywhere; a real start is rare; getting *good* is rarer. A contribution that only impresses experts fails the mission. Read [docs/PURPOSE.md](docs/PURPOSE.md) before opening a PR.

## How skills enter this repo

1. **Forge privately** — prove the skill on real work with acceptance tests.
2. **Export** — follow [SANITIZATION.md](SANITIZATION.md); genericize paths and names.
3. **Verify** — `node skills/<skill>/scripts/run-acceptance.js` → `"pass": true`.
4. **PR** — include skill name, SIS level, test command, and what was deliberately omitted.

## Skill structure

Day zero starts with `scripts/enter-the-dojo.js` (welcome), then Door A or Door B:

| Skill | Folder | Scripts |
|-------|--------|---------|
| first visit | `scripts/enter-the-dojo.js` | `--check` via `verify-os.js` |
| operator-profile | `skills/operator-profile/` | `lint-profile.js`, `run-acceptance.js` |
| memory-loop | `skills/memory-loop/` | `lint-memory.js`, `run-acceptance.js` |
| inspect-os | `skills/inspect-os/` | `inspect-os.js`, `run-acceptance.js` |
| connector-map | `skills/connector-map/` | `connector-map.js`, `run-acceptance.js` |
| career-loop | `skills/career-loop/` | `career-quality-gate.js`, `run-acceptance.js` |
| factory-intake | `skills/factory-intake/` | `skill-gate.js`, `run-acceptance.js` |
| dojo-belts | `skills/dojo-belts/` | `dojo-belts.js`, `run-acceptance.js` |
| dojo-training | `skills/dojo-training/` | `invite-training.js`, `after-door-a.js`, `run-acceptance.js` |
| os-101 | `skills/os-101/` | `os-101.js`, `run-acceptance.js` |
| os-201 | `skills/os-201/` | `os-201.js`, `run-acceptance.js` |
| superninja | `skills/superninja/` | scanners + `run-acceptance.js` |

```
skills/<kebab-name>/
  SKILL.md           # contract (~200 lines max)
  PORTABLE.md        # non-Cursor install
  references/        # lazy-loaded depth
  scripts/           # Node helpers (no npm deps preferred)
```

## Required updates when adding a skill

1. `README.md` — skills table + verify command (keep the start / stay / get-good story)
2. `docs/PURPOSE.md` — only if the skill changes what TheDojo is for
3. `docs/LAYOUT.md` — if layout changes
4. `eval/cases/HARD-cases.md` — mention skill folder
5. `scripts/verify-os.js` — register acceptance suite
6. Run `node scripts/verify-os.js` before PR

## Mission gate

The skill must answer in the PR:

1. Does this help a newcomer **start**, or help an operator **get good** (or both)?
2. How is that proven (`run-acceptance.js` or HARD cases)?
3. Does it run without one person’s private memory, paths, or one vendor?

If it is only a clever prompt, keep it out.

## Quality bar

- Binary acceptance tests (3–19 checks minimum for scripted skills)
- `recommend_only` for optimization/investigation skills
- No invented metrics, health scores, or token counts
- MP/QP citations when recommending optimizations

## Code of conduct

Be precise, honest about `could_not_verify`, and respect that operators — not agents — approve irreversible actions.
