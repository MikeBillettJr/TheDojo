# Repository layout

Clean conventions for a personal AI OS rooted in TheDojo.

```
TheDojo/                          # Your OS repo (clone or fork)
├── README.md                     # Human door: point an AI here
├── AGENTS.md                     # Agent constitution — first visit + boot
├── docs/
│   ├── WELCOME.md                # Founder story (enter-the-dojo prints this)
│   ├── PURPOSE.md                # Why TheDojo exists (the gap)
│   ├── LAUNCH.md                 # Day-zero onboarding (after welcome)
│   └── LAYOUT.md                 # This file
├── templates/memory/             # Starters — copy to memory/ once
├── memory/                       # Your live state (gitignore sensitive parts if needed)
│   ├── PROFILE.md
│   ├── agent-interface.md
│   ├── non-negotiables.md
│   ├── WORKING.md
│   ├── LESSONS.md
│   └── optimization/             # MP/QP catalogs (ship with repo)
├── skills/
│   ├── operator-profile/         # Day 0 — personalize
│   ├── memory-loop/              # Every session — persist
│   └── superninja/               # Weekly — optimize
├── eval/
│   ├── cases/                    # Repo-wide HARD rails
│   ├── operator-profile/
│   ├── memory-loop/
│   └── superninja/
└── scripts/
    ├── enter-the-dojo.js         # First visit (Windows / macOS / Linux)
    └── verify-os.js              # All suites + enter check
```

## Rules

| Path | Canonical? | Notes |
|------|------------|-------|
| `docs/WELCOME.md` | Yes (founder story) | Printed by `enter-the-dojo.js`; do not paraphrase |
| `memory/` | Yes (for your OS) | Never store secrets; cap WORKING ~30 lines |
| `templates/` | Starters only | Copy once; templates stay pristine in Git |
| `skills/` | Yes | Contracts + optional scripts |
| `eval/` | Tests/fixtures | Safe to commit; results dirs gitignored |
| Optional Obsidian vault | **No** | Navigation only; Git repo is SoT |

## Skill order

0. `scripts/enter-the-dojo.js` — hear who built this, then wait
1. `operator-profile` — identity
2. `memory-loop` — continuity
3. `superninja` — continuous improvement

When adding a new skill: update `README.md`, mention it in HARD-cases, register `verify-os.js`, and keep the start → stay → get-good story honest. Change `docs/PURPOSE.md` only if the mission itself changed.
