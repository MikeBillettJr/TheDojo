# TheDojo

*Where knowledge is shared.*

Everyone’s curious about AI.  
Most have zero idea where to actually start.  
Even fewer know how to get good at it.

**TheDojo exists to bridge that gap** — a proven personal AI OS you can start in an hour, then actually get better at using.

Not prompt dumps. Contracts, memory files, and tests that run on any model that can read a folder — Windows or Mac.

**[Why this exists](docs/PURPOSE.md)** · **[Start here — launch guide](docs/LAUNCH.md)**

```bash
git clone https://github.com/BillettFamily/TheDojo.git
cd TheDojo
node scripts/verify-os.js
```

Then follow [docs/LAUNCH.md](docs/LAUNCH.md): copy templates → identity interview → wrap up every session → weekly improvement scan.

---

## How you get from curious to good

| Stage | Skill | What changes |
|-------|--------|----------------|
| **Start** | [operator-profile](skills/operator-profile/) | The model knows how *you* work |
| **Stay** | [memory-loop](skills/memory-loop/) | Session 2 continues; it does not reboot |
| **Get good** | [superninja](skills/superninja/) | You find waste, apply one fix, measure |

Personalize → persist → improve. Domain skills (email, resume, sales ops) come **after** this loop.

Each skill has `PORTABLE.md` for Cursor, Claude Code, and plain chat.

Verify one skill or the whole OS:

```bash
node skills/operator-profile/scripts/run-acceptance.js
node skills/memory-loop/scripts/run-acceptance.js
node skills/superninja/scripts/run-acceptance.js
node scripts/verify-os.js
```

---

## Layout

See **[docs/LAYOUT.md](docs/LAYOUT.md)**.

```
TheDojo/
  docs/PURPOSE.md         ← why we exist (the gap)
  docs/LAUNCH.md          ← day-zero onboarding
  templates/memory/       ← copy to memory/ on day 0
  memory/                 ← your live state (+ MP/QP catalogs)
  skills/                 ← start / stay / get-good trio
  AGENTS.md               ← constitution for the agent
  eval/                   ← HARD cases + fixtures
  scripts/verify-os.js    ← all suites
```

---

## Philosophy

1. **Bridge the gap** — start is a first hour; getting good is a loop.
2. **Skills are contracts** — triggers, procedure, refusals.
3. **Scripts beat loops** — lint and scan deterministically (MP-1).
4. **Proven before published** — acceptance tests; no health scores or invented metrics.
5. **Human gates** — draft ≠ send; recommend_only for optimization.

---

## Contributing

Every new skill must help someone **start** or **get good**. Forge privately, sanitize, verify, PR. See [CONTRIBUTING.md](CONTRIBUTING.md) and [SANITIZATION.md](SANITIZATION.md).

## License

MIT — [LICENSE](LICENSE).
