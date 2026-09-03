# Piece names (load only while teaching 101)

| Name | What it is | Where it lives |
|------|------------|----------------|
| Skill | How the agent should work a job | `skills/<name>/SKILL.md` |
| Script | Deterministic check or action | `skills/<name>/scripts/*.js` |
| Workflow | Ordered steps / host automation | AGENTS procedure, CI yaml |
| MCP | Connector the host can call | `mcp.json` / Cursor MCP |
| API | Remote interface the connector uses | not a file you paste keys into |
| Key | Name of a secret slot | env **key name** only |
| Secret | The value | host secret store; never Git or memory |

Fake exam token: `sk-EXAMPLE_NOT_REAL` — if you see it in a fixture, redact. Never write it to PROFILE.
