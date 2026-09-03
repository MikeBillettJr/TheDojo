# inspect-os scan map

Load only when running Door B. The script `inspect-os.js` is the exam; this list is the contract.

## Ignore

`.git`, `node_modules`, `.gitkeep`, `.DS_Store`. Do not recurse the whole tree.

## Root files (existence only)

`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursorrules`

## Memory (`memory/`)

`PROFILE.md`, `WORKING.md`, `LESSONS.md`, `agent-interface.md`, `non-negotiables.md`

## Skills

Each `skills/<name>/SKILL.md` under `--root`. Do not inventory `~/.cursor/skills` unless `--root` points there.

## Cursor rules (optional)

`.cursor/rules/*.mdc` under `--root` only.

## TheDojo trio (gaps)

| Skill | Evidence (any one counts as present) |
|-------|--------------------------------------|
| operator-profile | `memory/PROFILE.md` or `skills/operator-profile/SKILL.md` |
| memory-loop | `memory/WORKING.md` or `skills/memory-loop/SKILL.md` |
| superninja | `skills/superninja/SKILL.md` |

Missing evidence → gap + merge-plan line. Never overwrite a file that already exists.

## Output

JSON only. No file bodies. Secret patterns in any string → `[REDACTED]`. `wrote` is always `false`.

Existing setup → include `training_invite` from `dojo-training` (`--mode door_b`). Blank tree → `training_invite` is the cold card (`invited: false`). Never dump 101–501. `belt_credit` stays false.
