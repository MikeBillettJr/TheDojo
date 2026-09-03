# Invite map (load only when mapping is unclear)

`practiced` = file hint. `next` = choice. Neither is a belt.

| Signal | practiced (hint) | Prefer in next |
|--------|------------------|----------------|
| Secret-like string under memory/ | (not 101) | **101** first |
| PROFILE.md and no secret | 101 | — |
| WORKING.md | 301 | 301 if WORKING missing |
| skills present, no mcp.json | — | 201 |
| No docs/LAYOUT.md or WORKING > 30 lines | — | 401 |

Cap `next` at 2. Never list 501 here. Never emit a five-lesson catalog.

Unlock is always `choice`. `exam_required` is always true.
