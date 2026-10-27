# TheDojo

*Where knowledge is shared.*

**If you are a human:** copy this into any AI chat (Cursor, Claude, ChatGPT, etc.):

```text
Open this GitHub repo: https://github.com/MikeBillettJr/TheDojo
Go in the front door and tell me what you find.
Don't give me a tour of the files. Then wait.
```

That is the whole start. You do not need to clone anything first.

If the folder is already open in Cursor, you can just say: **Enter the dojo.**

**If you are an AI:** this is a first visit. Do not summarize the repo. Do not list files.

1. If you can run commands in this folder: `node scripts/enter-the-dojo.js` (Windows, macOS, and Linux; Node 18+).
2. If you only have the GitHub link: open `docs/WELCOME.md` (or the raw file on GitHub) and speak it almost as written.
3. Then wait. Do not start setup until they ask.

---

Everyone is curious about AI.
Most have zero idea where to actually start.
Even fewer know how to get good at it.

**TheDojo exists to bridge that gap.** A proven personal AI OS you can start in an hour, then actually get better at using.

Not prompt dumps. Contracts, memory files, and tests that run on any model that can read a folder.

Maintainer: [Mike Billett Jr.](https://github.com/MikeBillettJr) ([LinkedIn](https://www.linkedin.com/in/michael-billett-jr))

**[The welcome](docs/WELCOME.md)** · **[Why this exists](docs/PURPOSE.md)** · **[Start here](docs/LAUNCH.md)**

```bash
git clone https://github.com/MikeBillettJr/TheDojo.git
cd TheDojo
node scripts/enter-the-dojo.js
node scripts/verify-os.js
```

Then follow [docs/LAUNCH.md](docs/LAUNCH.md): Door A (from scratch) or Door B (inspect an existing setup), then wrap up every session and scan weekly.

---

## How you get from curious to good

| Stage | Skill | What changes |
|-------|--------|----------------|
| **Start (Door A)** | [operator-profile](skills/operator-profile/) | The model knows how *you* work |
| **Start (Door B)** | [inspect-os](skills/inspect-os/) | You already have an OS; inspect, do not overwrite |
| **One call** | [os-201](skills/os-201/) | After 101. One tool call beats a guess. A pass tells you to run a tool on your computer, using placeholder folders only |
| **Connect** | [connector-map](skills/connector-map/) | Name what your AI can already reach; send stays gated |
| **Stay** | [memory-loop](skills/memory-loop/) | Session 2 continues; it does not reboot |
| **Get good** | [superninja](skills/superninja/) | You find waste, apply one fix, measure |
| **Hunt** | [career-loop](skills/career-loop/) | Wow-only packet; fail-closed gate; human approve before send |
| **Forge** | [factory-intake](skills/factory-intake/) | Spec before write; tests; then ship. Gate never writes live skills |
| **Prove** | [dojo-belts](skills/dojo-belts/) | Katas pass or fail. Belts are consecutive. No health score |

Personalize, persist, improve. Then hunt with a packet you can defend. Forge the next skill the same way. Prove it with tests, not a score.

Each skill has `PORTABLE.md` for Cursor, Claude Code, and plain chat.

```bash
node skills/operator-profile/scripts/run-acceptance.js
node skills/memory-loop/scripts/run-acceptance.js
node skills/inspect-os/scripts/run-acceptance.js
node skills/connector-map/scripts/run-acceptance.js
node skills/superninja/scripts/run-acceptance.js
node skills/career-loop/scripts/run-acceptance.js
node skills/factory-intake/scripts/run-acceptance.js
node skills/dojo-belts/scripts/run-acceptance.js
node skills/dojo-training/scripts/run-acceptance.js
node skills/os-101/scripts/run-acceptance.js
node skills/os-201/scripts/run-acceptance.js
node scripts/verify-os.js
```

---

## Layout

See **[docs/LAYOUT.md](docs/LAYOUT.md)**.

```
TheDojo/
  docs/WELCOME.md         <- founder story (AI prints this first)
  docs/PURPOSE.md         <- why we exist (the gap)
  docs/LAUNCH.md          <- day-zero onboarding
  templates/memory/       <- copy to memory/ on day 0
  memory/                 <- your live state (+ MP/QP catalogs)
  skills/                 <- Door A/B + stay / get-good / hunt / forge / prove
  AGENTS.md               <- constitution for the agent
  eval/                   <- HARD cases + fixtures
  scripts/enter-the-dojo.js
  scripts/verify-os.js
```

---

## Philosophy

1. **Bridge the gap** - start is a first hour; getting good is a loop.
2. **Skills are contracts** - triggers, procedure, refusals.
3. **Scripts beat loops** - lint and scan deterministically.
4. **Proven before published** - acceptance tests; no health scores or invented metrics.
5. **Human gates** - draft is not send; recommend_only for optimization.

---

## Contributing

Every new skill must help someone **start** or **get good**. Forge privately, sanitize, verify, PR. See [CONTRIBUTING.md](CONTRIBUTING.md) and [SANITIZATION.md](SANITIZATION.md).

## License

MIT. See [LICENSE](LICENSE).
