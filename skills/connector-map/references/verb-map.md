# Connector verb map

Used by `connector-map.js`. Name match is lowercase.

| Name contains | Verb | Why |
|---------------|------|-----|
| gmail, mail, slack, twitter (not *read*) | `draft` | Outbound exists; draft ≠ send |
| x-read, x_read | `read` | Headless read; not posting |
| github, git | `read` | Repo/issue read; writes still gated |
| anything else | `read` | Default conservative |

`send_allowed` is **always false** in v1. Browser-only tools (LinkedIn, X posting) are not MCP rows; do not invent them.
