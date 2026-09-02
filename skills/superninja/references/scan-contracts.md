# superninja scan contracts (inject into scripts; do not rediscover)

Closed list. Scripts emit only these pattern ids. Unknown → omit (do not invent ids).

## Shared CLI

- Node, no npm deps.
- `parseArgs`: `--key value` or `--flag`.
- stdout = one JSON object (or Markdown for the renderer). stderr = errors.
- Exit 0 on successful scan (including honest empty). Exit 2 on missing required path / unreadable source (`could_not_verify`).
- **Read-only** on vault and live repo/transcripts. Optional `--out <file>` may write JSON/MD under the caller’s path (tests use `eval/superninja/results/`).
- Never estimate tokens. If no `usage` / `message.usage` objects: `token_status: "unavailable"`, `tokens: null`.
- Redact before emit: `\b(sk-|ghp_|github_pat_|xox[baprs]-|BEGIN [A-Z ]+PRIVATE KEY)`. Replace match + following token with `[REDACTED]`.
- No `health_score`, no invented `%`. `tokens` stays `null` even if usage objects exist (do not sum). Character counts may appear as `parent_visible_characters` labeled as not tokens.
- Every finding: `{ id, pattern, severity, evidence, recommendation, status: "recommend_only" }`.
- `id` === `pattern` (MP-n or QP-n from catalogs).
- Every scanner JSON and the pipeline result includes `duration_ms` (number >= 0). Do not invent token counts from it.

## session-scan.js

```
node session-scan.js --root <dir> [--max-files N] [--max-lines N] [--out file]
```

- Recurse for `**/agent-transcripts/**/*.jsonl` and also accept a directory of `.jsonl` (fixtures).
- Cap files by `--max-files` (default 50, newest mtime first). Cap lines per file with `--max-lines`.
- Parse each line as JSON. Skip malformed lines; count `lines_skipped`.
- Tool calls: `message.content[]` where `type === "tool_use"` (same shape as typical agent transcript parsers).

Detections (per file, then aggregated):

| pattern | Rule (deterministic) |
|---------|----------------------|
| MP-1 | A consecutive run of the **same** `tool_use.name` with length **> 5**. Evidence: `{ "file", "tool", "consecutive_count" }` |
| MP-3 | The first 2 or 3 tool calls in the file are all in the discovery set: `Glob`, `Grep`, `GetMcpTools`, `SemanticSearch`, `WebSearch`, or name matching `/^list_/i` `/^search_/i` `/^describe_/i` |
| MP-4 | First `Glob` `input.glob_pattern` or `input.pattern` is `**/*` or `**` |
| MP-5 | A streak of **≥ 3** consecutive assistant messages that each contain exactly one `Task` / `Subagent` tool_use |
| MP-15 | Any `Task`/`Subagent` input has `resume` set, **or** ≥ 2 Task prompts whose text starts with `continue` / `keep going` (case-insensitive) |
| QP-6 | Zero readable jsonl files → `could_not_verify: ["no_transcripts"]`; do not claim healthy |

Output schema `thedojo.superninja.session-scan.v1`:

```json
{
  "schema": "thedojo.superninja.session-scan.v1",
  "source_root": "<abs>",
  "scanned_at": "<ISO>",
  "files_scanned": 0,
  "files_skipped": 0,
  "lines_skipped": 0,
  "token_status": "unavailable",
  "tokens": null,
  "tool_calls": 0,
  "findings": [],
  "could_not_verify": [],
  "status": "recommend_only",
  "duration_ms": 0
}
```

## vault-scan.js

```
node vault-scan.js --vault <dir> [--out file]
```

- Read-only. Skip directory name `.obsidian`.
- Count `*.md` notes (recursive).
- If vault missing/unreadable → exit 2; include `could_not_verify: ["vault_unreadable"]`.
- If the only markdown is `Welcome.md` whose body contains `This is your new *vault*` → `vault_kind: "fresh_or_empty"`.
- If any markdown matches `/\b(source of truth|canonical SoT|this vault is canonical)\b/i` → finding **QP-1** (vault is not SoT; Git repository (canonical) is).
- Always set `sot: "Git repository (canonical)"` and `vault_role: "navigation_only"`.
- Do not write vault files.

Output schema `thedojo.superninja.vault-scan.v1`:

```json
{
  "schema": "thedojo.superninja.vault-scan.v1",
  "vault": "<abs>",
  "scanned_at": "<ISO>",
  "sot": "Git repository (canonical)",
  "vault_role": "navigation_only",
  "vault_kind": "fresh_or_empty|populated|unreadable",
  "markdown_notes": 0,
  "findings": [],
  "could_not_verify": [],
  "status": "recommend_only",
  "duration_ms": 0
}
```

## repo-scan.js

```
node repo-scan.js --repo <dir> [--runtime <dir>] [--out file]
```

- Read-only vs the repo tree (except optional `--out`).
- Missing source → append to `could_not_verify`; do not emit a fake zero as proof of health.

Closed finding map (only these pattern ids):

| id | When |
|----|------|
| QP-17 | HARD-cases.md `hard-NN` ids vs hard-cases.jsonl `"id":"hard-NN"` differ (set difference non-empty) |
| QP-11 | `--runtime` given and `skills/*/SKILL.md` bytes differ from `<runtime>/skills/*/SKILL.md` |
| QP-1 | Markdown under `skills/` claims the vault/Obsidian is SoT **or** `memory/**/*.md` matches the secret regex (wrong-tier store; evidence `{ "file", "redacted": true }` — never print the secret) |
| QP-6 | Required path missing: `AGENTS.md`, `skills/`, `eval/cases/HARD-cases.md`, `memory/optimization/meta-patterns.md` |
| QP-16 | No WORKING file found: repo `memory/WORKING.md` missing **and** (if `--runtime` given) runtime `memory/WORKING.md` also missing. Repo-only `WORKING.template.md` is the repo hot-loop pattern, not QP-16. |
| MP-9 | A `SKILL.md` exists outside `skills/` (exclude `node_modules`, `.git`, `eval/`) |
| MP-13 | `HARD-cases.md` has zero `hard-` rows **or** WORKING line count **> 35** (repo file if present, else runtime `memory/WORKING.md`; evidence `{ "file", "line_count": N, "cap": 30 }`) **or** skill folder names under `skills/` with no mention in HARD-cases.md (evidence `{ "skills_missing_eval": ["..."] }` — one finding, no coverage %) |

Output schema `thedojo.superninja.repo-scan.v1`:

```json
{
  "schema": "thedojo.superninja.repo-scan.v1",
  "repo": "<abs>",
  "runtime": "<abs or null>",
  "scanned_at": "<ISO>",
  "sot": "Git repository (canonical)",
  "working_line_count": null,
  "hard_ids_md": [],
  "hard_ids_jsonl": [],
  "findings": [],
  "could_not_verify": [],
  "status": "recommend_only",
  "duration_ms": 0
}
```

## render-ninja-card.js

```
node render-ninja-card.js --session <json> --vault <json> --repo <json> [--out file]
```

- Merge `findings` from all three. Rank: `severity` warn > info; then `evidence.consecutive_count` or `evidence.line_count` or `evidence.count` descending.
- Print **at most 3** recommendations on the card. Extra findings: count only (`Deferred findings: N`).
- Markdown template: `references/ninja-card.md`.
- Must include: `recommend_only`, `Git repository (canonical)`, vault `navigation_only`.
- Copy `token_status` from session JSON. If unavailable: `tokens: could_not_verify`.
- If a scan JSON is missing/unreadable: that source is `could_not_verify` (do not invent empty-healthy).
- If `schema` is missing or not the expected `*.v1` id: `could_not_verify` that source; do not use its findings.
- If any input JSON has a `health_score` key: emit a **rejected** card (not a shippable `recommend_only`); do not copy `health_score` into the card.
- Strip leftover secret patterns (`sk-EXAMPLE_NOT_REAL` → `[REDACTED]`).
- Must **not** contain: `health_score`, `masterninja`, `SIS v3 PASS`, `SIS v4 PASS`.

## run-pipeline.js

```
node run-pipeline.js --sessions <dir> --vault <dir> --repo <dir> [--runtime <dir>] [--out-dir <dir>]
```

- Unattended. No LLM. Runs session-scan → vault-scan → repo-scan → render-ninja-card in one process.
- Writes `session.json`, `vault.json`, `repo.json`, `card.md`, `pipeline.json` under `--out-dir` (default `eval/superninja/results/pipeline`).
- stdout = one JSON object `thedojo.superninja.pipeline.v1` with `duration_ms` and child objects `session` / `vault` / `repo` (each with `duration_ms`) plus `card` markdown.
- Exit 0 on honest degrade. Exit 2 if required CLI args missing.
- Unless `--no-history`, append a fingerprint row via `regression-report.js --append` to `eval/superninja/history.jsonl`.

## regression-report.js

```
node regression-report.js --append <pipeline.json> [--history file]
node regression-report.js --history <file>
```

- Fingerprint: `finding_count` + `pattern_counts` (MP-/QP- ids). No `health_score`, no %.
- `--history` with ≥2 rows: compare last two → each pattern `trend`: worse | better | same.
- Fewer than 2 rows: `could_not_verify: ["need_two_scans"]` or `["no_history"]`.

## run-acceptance.js

```
node run-acceptance.js
```

Repo root: `path.resolve(__dirname, '../../..')` (script is `skills/superninja/scripts/`).
Fixture root: `<repo>/eval/superninja/fixtures/`.

Binary checks (all must pass):

1. MP-1 fixture dir → session-scan finding `MP-1` with `evidence.consecutive_count >= 6`
2. no-tokens fixture dir → `token_status === "unavailable"` && `tokens === null`
3. secrets fixture → stdout/card must not contain `sk-EXAMPLE_NOT_REAL` or `ghp_EXAMPLE_NOT_REAL`
4. vault-fresh → `vault_kind === "fresh_or_empty"`, no `health_score` key, `sot` includes `canonical`
5. vault-sot-claim → finding pattern `QP-1`
6. repo-mini → MP-13 WORKING finding with `line_count > 35`; QP-17 HARD id mismatch
7. rendered card contains `recommend_only` and at least one `MP-` or `QP-` and does not contain `masterninja` or `health_score`
8. After vault-scan, `vault-fresh/Welcome.md` mtime is unchanged (read-only)
9. run-pipeline.js on fixtures produces session+vault+repo+card; `status === "recommend_only"`
10. Five consecutive run-pipeline.js runs each include `duration_ms` (number >= 0) on the pipeline result AND each child scan object
11. Injected `health_score` scan JSON → renderer emits rejected / `could_not_verify`; card has no `health_score` and is not a shippable `recommend_only`
12. Injected `sk-EXAMPLE_NOT_REAL` scan JSON → card omits it (`[REDACTED]` or absent)
13. Empty session root → `token_status` unavailable, `could_not_verify` includes `no_transcripts`; no `health_score`
14. Malformed jsonl line → `lines_skipped >= 1`; process does not crash; no fake health
15. Stale/unknown schema JSON → render `could_not_verify` that source; no invented recs from it
16. After run-pipeline.js, `vault-fresh/Welcome.md` mtime is unchanged
17. SKILL.md contains `run-pipeline.js` and `must not self-rename`; does not claim `masterninja PASS` / `SIS v4 PASS`
18. regression-report on two-row fixture: MP-1 `trend` worse and no `health_score`
19. regression-report on one-row fixture: `could_not_verify` includes `need_two_scans`

Print JSON `{ "pass": bool, "checks": [...] }` and exit 1 if any fail.
