# TheDojo

*Where knowledge is shared.*

**The proven starter kit for a personal AI OS** — personalize, persist, and continuously improve any agent on Cursor, Claude Code, or generic chat.

Private forge → public publish. Skills are contracts with binary acceptance tests, not prompt dumps.

---

## Start here

**[docs/LAUNCH.md](docs/LAUNCH.md)** — day-zero guide (copy templates → interview → wrap-up → weekly scan)

Verify everything:

```bash
node scripts/verify-os.js
```

---

## Core skills (ship in this order)

| # | Skill | Purpose | Verify |
|---|-------|---------|--------|
| 1 | [operator-profile](skills/operator-profile/) | Day-zero identity interview → `memory/PROFILE*` | `node skills/operator-profile/scripts/run-acceptance.js` |
| 2 | [memory-loop](skills/memory-loop/) | WORKING + LESSONS + wrap-up ritual | `node skills/memory-loop/scripts/run-acceptance.js` |
| 3 | [superninja](skills/superninja/) | MP/QP optimization investigator | `node skills/superninja/scripts/run-acceptance.js` |

**Stack:** personalize → persist → optimize.

Each skill includes `PORTABLE.md` for non-Cursor hosts.

---

## Repository layout

See **[docs/LAYOUT.md](docs/LAYOUT.md)**.

```
TheDojo/
  docs/LAUNCH.md          ← onboarding
  templates/memory/       ← copy to memory/ on day 0
  memory/                 ← your live state (+ optimization catalogs)
  skills/                 ← operator-profile, memory-loop, superninja
  AGENTS.md               ← public constitution
  eval/                   ← HARD cases + per-skill fixtures
  scripts/verify-os.js    ← all acceptance suites
```

---

## Also included

- `memory/optimization/` — meta-patterns (MP) and quality-patterns (QP) catalogs
- `eval/cases/` — lite HARD policy rails
- `SANITIZATION.md` — export gate for maintainers
- `CONTRIBUTING.md` — how to add skills without breaking layout

---

## Philosophy

1. **Skills are contracts** — triggers, procedure, refusals.
2. **Scripts beat loops** — lint and scan deterministically (MP-1).
3. **Proven before published** — acceptance tests; no health scores or invented metrics.
4. **Human gates** — draft ≠ send; recommend_only for optimization.

---

## Contributing

Forge privately, sanitize, verify, PR. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — [LICENSE](LICENSE).
