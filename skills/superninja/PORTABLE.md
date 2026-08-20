# superninja — portable install

This skill is **host-agnostic**: markdown contract + Node scripts (no npm dependencies).

## Cursor (recommended)

1. Clone [TheDojo](https://github.com/BillettFamily/TheDojo) or copy `skills/superninja/` into your OS repo.
2. Copy or symlink to `~/.cursor/skills/superninja/` (Windows: `%USERPROFILE%\.cursor\skills\superninja\`).
3. Ensure your OS repo has `AGENTS.md`, `memory/optimization/*.md`, and `eval/cases/HARD-cases.md` (minimal set ships with TheDojo).
4. Trigger: “run superninja” or “ninja card”.

## Claude Code / CLI agents

1. Place this folder under your project’s `skills/superninja/`.
2. Point the agent at `SKILL.md` when optimizing workflows.
3. Run the pipeline from your repo root with absolute paths in the `--sessions`, `--vault`, `--repo`, and `--runtime` flags.

## ChatGPT / generic chat

1. Paste `SKILL.md` + the MP/QP catalogs (`memory/optimization/*.md`) into custom instructions or a project file.
2. Manually run the Node pipeline in a terminal; paste the generated `card.md` back into chat for interpretation.
3. Do **not** ask the model to re-implement scanners in chat — that violates MP-1.

## Required layout (repo scan)

```
your-ai-os/
  AGENTS.md
  skills/
  memory/optimization/meta-patterns.md
  memory/optimization/quality-patterns.md
  eval/cases/HARD-cases.md
  memory/WORKING.md          # optional; open-loop file (~30 lines)
```

## Session transcript layout (Cursor)

Default glob: `**/agent-transcripts/**/*.jsonl` under your Cursor projects directory.

Other hosts: export tool-call logs as jsonl with `message.content[]` entries where `type === "tool_use"`, or adapt `session-scan.js`.
