# Repository layout

Clean conventions for a personal AI OS rooted in TheDojo.

```
TheDojo/                          # Your OS repo (clone or fork)
├── README.md                     # Overview + link to launch guide
├── AGENTS.md                     # Agent constitution — adapt paths
├── docs/
│   ├── LAUNCH.md                 # Day-zero onboarding (start here)
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
    └── verify-os.js              # Run all acceptance suites
```

## Rules

| Path | Canonical? | Notes |
|------|------------|-------|
| `memory/` | Yes (for your OS) | Never store secrets; cap WORKING ~30 lines |
| `templates/` | Starters only | Copy once; templates stay pristine in Git |
| `skills/` | Yes | Contracts + optional scripts |
| `eval/` | Tests/fixtures | Safe to commit; results dirs gitignored |
| Optional Obsidian vault | **No** | Navigation only; Git repo is SoT |

## Skill order

1. `operator-profile` — identity
2. `memory-loop` — continuity
3. `superninja` — continuous improvement

When adding a new skill: update `README.md`, `eval/cases/HARD-cases.md`, and run `verify-os.js`.
