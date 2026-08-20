# TheDojo

**Proven AI skills for any operator.** TheDojo is the public home for skills forged and tested in a private OS, then sanitized and released with binary acceptance tests.

OurDojo (private) = forge. **TheDojo (this repo) = publish.**

## What's here

| Skill | SIS | Verify |
|-------|-----|--------|
| [superninja](skills/superninja/) — optimization investigator (MP/QP scan → Ninja card) | v2 Knowledge | `node skills/superninja/scripts/run-acceptance.js` |

Also ships:

- `memory/optimization/` — meta-patterns (MP) and quality-patterns (QP) catalogs
- `AGENTS.md` — public agent constitution (adapt for your OS)
- `eval/cases/` — lite HARD rails

## Quick start

1. Clone this repo (or copy `skills/superninja/` into your AI OS repo).
2. Install [Node.js](https://nodejs.org/) 18+ (scripts have zero npm dependencies).
3. Run acceptance:

```bash
node skills/superninja/scripts/run-acceptance.js
```

4. Point your agent at `skills/superninja/SKILL.md`. See [PORTABLE.md](skills/superninja/PORTABLE.md) for Cursor, Claude Code, and generic chat.

## Layout

```
TheDojo/
  AGENTS.md                 # public constitution
  skills/<name>/SKILL.md    # skill contract
  memory/optimization/      # MP/QP catalogs
  eval/                     # acceptance fixtures + HARD cases
  SANITIZATION.md           # export gate (for maintainers)
```

## Philosophy

1. **Skills are contracts** — triggers, procedure, refusals; not one-off prompts.
2. **Scripts beat loops** — deterministic scanners under creative reasoning (MP-1).
3. **Proven before published** — binary tests; no health scores or invented metrics.
4. **Recommend only** — superninja and similar skills never auto-apply changes.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Skills are forged privately, exported through [SANITIZATION.md](SANITIZATION.md), and reviewed before merge.

## License

MIT — see [LICENSE](LICENSE).
