# Ninja card (copy-paste shell)

Keep the user-facing card short. Scripts fill the fields. Do not add a health score.

```markdown
# Ninja card
Status: **recommend_only** — no changes applied.
SoT: Git repository (canonical). Vault: navigation-only (read-only scan). Runtime: hot-copy (not canonical).

Scanned at: <ISO>
- Sessions: <files_scanned> jsonl; token_status: <unavailable|partial_or_complete>; tokens: <could_not_verify|null>
- Vault: <vault_kind>; markdown notes: <n>
- Repo: WORKING lines <n or could_not_verify>; HARD md vs jsonl: <match|mismatch>

could_not_verify: <list or none>

## Top recommendations (max 3)
1. **<MP-x or QP-x>** — <one line>  
   Evidence: <file / count / source>  
   Do: <smallest reversible step>  
   Risk: <one line>
2. …
3. …

Deferred findings: <n> (not shown)

## Apply
Nothing is applied until the operator approves a **named** change (file + action).
```
