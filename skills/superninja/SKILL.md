---
name: superninja
description: >-
  Optimization investigator for any AI OS: scan agent session transcripts,
  an optional Obsidian vault, and your skills repo for meta-pattern (MP) and
  quality-pattern (QP) waste; emit a recommend-only Ninja card. Triggers:
  superninja, ninja card, optimization investigator, scan sessions for MP/QP.
  Do not use for weekly hygiene glances or building new skills from scratch.
---

# superninja (optimization investigator)

**Proven:** SIS v2 Knowledge — binary acceptance suite (`run-acceptance.js`) ships with this skill. This skill must not self-rename.

**When to use:** “run superninja”, “ninja card”, scan transcripts / vault / repo for MP/QP waste.

**When not to use:** one-off tasks; building a new skill (use your factory/intake workflow); applying changes without human approval.

## Intent / Done / Boundaries (restate every run)

1. **Intent** — find evidenced MP/QP waste; recommend only.
2. **Done** — one Ninja card (max 3 recs, each cited MP/QP); scripts produced the counts.
3. **Boundaries** — no auto-apply; vault read-only; **Git repository is canonical SoT**; never invent metrics/tokens; recommend_only until the operator approves a named change.

## Configure your homes

Set paths for your machine. Examples:

| Home | Purpose | Example (macOS/Linux) | Example (Windows) |
|------|---------|----------------------|-------------------|
| **Repo** | Versioned skills, policies, eval | `~/Projects/my-ai-os` | `%USERPROFILE%\Projects\my-ai-os` |
| **Runtime** | Hot-copy skills the agent loads | `~/.cursor/skills` | `%USERPROFILE%\.cursor\skills` |
| **Vault** | Optional Obsidian library (navigation only) | `~/Documents/Obsidian/MyVault` | optional |
| **Sessions** | Cursor agent transcripts | `~/.cursor/projects/**/agent-transcripts/**/*.jsonl` | same pattern |

Catalogs (ship with this repo): `memory/optimization/meta-patterns.md` + `quality-patterns.md`.

## Procedure

1. Confirm you read **this** file (do not freestyle from memory).
2. Restate Intent / Done / Boundaries.
3. Load `references/scan-contracts.md` only when debugging scripts; otherwise **run scripts**.
4. Run the **unattended pipeline** (no LLM). Do not line-loop jsonl (MP-1):

```bash
node skills/superninja/scripts/run-pipeline.js \
  --sessions "<sessions-root>" \
  --vault "<vault-dir-or-empty-fixture>" \
  --repo "<repo-root>" \
  --runtime "<runtime-root>" \
  --out-dir eval/superninja/results/latest
```

5. Show the **Ninja card** (template: `references/ninja-card.md`). Grade the card, not vibes (QP-7).
6. If scan history has two or more rows, run `regression-report.js --history eval/superninja/history.jsonl` and show pattern **trend** (worse / better / same). Counts only — no health score.
7. **Stop.** Classify each rec: auto-safe docs vs needs approval (rules/skills/deletes). **Do not apply until the operator names the change** (file + action).
8. Optional write-back: log that a scan ran + card path — not fake health.

## Failures to refuse

- Invented metrics, health scores, or token counts (`token_status: unavailable` → `tokens: could_not_verify`)
- Auto-applying recs or silent policy/skill edits
- Treating the Obsidian vault as SoT or writing the vault
- Agent line-loop over jsonl instead of `run-pipeline.js` / `session-scan.js` (MP-1)
- Builder self-PASS on acceptance tests — use an independent validator when stakes are high
- Persisting secrets from transcripts into the card or memory (redact)

## Verify install

```bash
node skills/superninja/scripts/run-acceptance.js
```

Expect `"pass": true`. See `PORTABLE.md` for non-Cursor hosts.
