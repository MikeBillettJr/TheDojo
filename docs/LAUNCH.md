# AI OS launch guide

Everyone’s curious. This is **where to actually start** — then how to **get good**.

If you are with an AI: say **Enter the dojo** first. The AI should run `node scripts/enter-the-dojo.js` (Windows, macOS, and Linux) and wait. Then come back here.

Day zero → week one. Complete steps in order. If you only have an hour, finish Step 0 and Step 1. If you have a week, you will have a practice, not a demo.

Full why: [PURPOSE.md](PURPOSE.md). Founder story: [WELCOME.md](WELCOME.md).

## Prerequisites

- [Node.js 18+](https://nodejs.org/) (for lint and superninja scripts)
- An AI host: [Cursor](https://cursor.com), Claude Code, or any chat with file access
- This repo cloned locally

## Step 0 — Scaffold your OS folder

Use this repo as your OS root **or** copy its layout into your own repo:

```bash
git clone https://github.com/BillettFamily/TheDojo.git my-ai-os
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

## Verify entire OS

```bash
node scripts/verify-os.js
```

All three suites must report `"pass": true`.

## Week-one checklist

| Day | Action |
|-----|--------|
| 0 | Templates → memory; operator-profile interview |
| 1–6 | memory-loop every session; keep WORKING ≤30 lines |
| 7 | First superninja scan; apply one MP/QP fix if warranted |

## Next

Add domain skills (writing, sales ops, etc.) **after** the core loop works. See `CONTRIBUTING.md` if you forge your own.
