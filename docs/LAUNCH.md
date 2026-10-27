# AI OS launch guide

Everyone’s curious. This is **where to actually start** — then how to **get good**.

If you are with an AI: say **Enter the dojo** first. The AI should run `node scripts/enter-the-dojo.js` (Windows, macOS, and Linux) and wait. Then come back here.

Pick a door:

| Door | You are | Next |
|------|---------|------|
| **A — new** | Starting from scratch | Step 0 → Step 1 (`operator-profile`) |
| **B — existing** | You already have Cursor/Claude/memory/skills | `inspect-os` (read-only gap card). Then optionally `connector-map`. Do not run the identity interview on a blank tree under Door B. |

Day zero → week one. If you only have an hour, finish Door A Step 0–1 **or** one Door B inspect. If you have a week, you will have a practice, not a demo.

Full why: [PURPOSE.md](PURPOSE.md). Founder story: [WELCOME.md](WELCOME.md).

## Prerequisites

- [Node.js 18+](https://nodejs.org/) (for lint and superninja scripts)
- An AI host: [Cursor](https://cursor.com), Claude Code, or any chat with file access
- This repo cloned locally

## Step 0 — Scaffold your OS folder

Use this repo as your OS root **or** copy its layout into your own repo:

```bash
git clone https://github.com/MikeBillettJr/TheDojo.git my-ai-os
cd my-ai-os
```

Copy starter memory templates:

```bash
# macOS / Linux
mkdir -p memory
cp templates/memory/*.template.md memory/
# Rename .template.md → .md (or copy contents manually on Windows)

# Windows PowerShell
New-Item -ItemType Directory -Force memory | Out-Null
Copy-Item templates\memory\*.template.md memory\
Get-ChildItem memory\*.template.md | ForEach-Object {
  $dest = Join-Path $_.DirectoryName ($_.BaseName -replace '\.template$','')
  if ($dest -notmatch '\.md$') { $dest += '.md' }
  Move-Item $_.FullName $dest -Force
}
```

Install skills into Cursor (optional but recommended):

```bash
# Copy each skill to ~/.cursor/skills/ (see each skill's PORTABLE.md)
```

Read `AGENTS.md` — adapt paths to your machine.

## Door B — already have a setup (`inspect-os`)

**Trigger:** “I already have a setup — inspect my OS.”

```bash
node skills/inspect-os/scripts/inspect-os.js --root <your-os-folder>
node skills/inspect-os/scripts/run-acceptance.js
```

Read-only. Never overwrite PROFILE or skills. Blank folder → switch to Door A.

Then optionally map connectors (send stays gated):

```bash
node skills/connector-map/scripts/connector-map.js --mcp-file <path-to-mcp.json>
node skills/connector-map/scripts/run-acceptance.js
```

## Step 1 — Personalize (`operator-profile`)

**Trigger:** “Run operator profile — identity interview.”

1. Agent asks 3 questions per turn from the core deck (9 questions).
2. You approve drafts before anything is written to `memory/`.
3. Verify:

```bash
node skills/operator-profile/scripts/run-acceptance.js
node skills/operator-profile/scripts/lint-profile.js --dir memory
```

**Done when:** `PROFILE.md`, `agent-interface.md`, and `non-negotiables.md` pass lint and feel accurate to you.

After 101 (name the pieces), the next practice is One call:

```bash
node skills/os-201/scripts/os-201.js --mode exam
```

A pass does not award a belt. The card tells you to run a tool on your own computer. It names two placeholder folders, `tools/<your-tool>` and `tools/<your-kit>`. This public repo does not ship a private tool path. TheDojo does not run it for you.

## Step 2 — Persist (`memory-loop`)

Every session:

1. Agent loads `memory/WORKING.md` at start (Focus + open loops).
2. After non-trivial work → write-back (update WORKING, optional LESSONS).
3. End with **“wrap up”** — not “stop” (stop pauses; wrap-up saves).

Verify:

```bash
node skills/memory-loop/scripts/run-acceptance.js
node skills/memory-loop/scripts/lint-memory.js --dir memory
```

**Done when:** Session 2 opens with the agent knowing your Focus without re-explaining everything.

## Step 3 — Improve (`superninja`)

Weekly or after a frustrating session:

```bash
node skills/superninja/scripts/run-pipeline.js \
  --sessions "<your-cursor-projects-dir>" \
  --vault "<optional-obsidian-dir-or-fixture>" \
  --repo "." \
  --runtime "<your-cursor-skills-parent-if-any>" \
  --out-dir eval/superninja/results/latest
```

Review the Ninja card — apply **at most one** named change; re-scan to confirm trend.

Verify:

```bash
node skills/superninja/scripts/run-acceptance.js
```

## After the core loop — hunt (`career-loop`)

**Trigger:** “Run the career quality gate” / “package this role” / “wow-only apply”.

Not day zero. After profile + memory work, put one role in a packet (`freeze/people-research.md`, `build/resume.md`, `build/cover.md`) and fail closed:

```bash
node skills/career-loop/scripts/career-quality-gate.js --packet <packetRoot> --md-only --no-write
node skills/career-loop/scripts/run-acceptance.js
```

Skinny resumes and company-explainer covers FAIL. Named hiring managers need a source or `could_not_verify`. The gate never sends (`send_allowed: false`). Wait for a named **approve submit**.

## Verify entire OS

```bash
node scripts/verify-os.js
```

All suites must report `"pass": true`.

## Prove it (`dojo-belts`)

**Trigger:** “What belt am I?” / “Run the katas.”

Not a health score. Belts are consecutive: a failed kata blocks every belt above it.

```bash
node skills/dojo-belts/scripts/dojo-belts.js
node skills/dojo-belts/scripts/run-acceptance.js
```

White = welcome. Yellow = profile. Green = memory-loop. Brown = superninja. Black = every `verify-os.js` suite.

## Week-one checklist

| Day | Action |
|-----|--------|
| 0 | Door A: templates → memory; operator-profile. **Or** Door B: inspect-os on your existing folder |
| 1–6 | memory-loop every session; keep WORKING ≤30 lines |
| 7 | First superninja scan; apply one MP/QP fix if warranted |

## Next

Forge the next skill with `factory-intake`. Prove progress with `dojo-belts` (tests, not scores). See `CONTRIBUTING.md`.
