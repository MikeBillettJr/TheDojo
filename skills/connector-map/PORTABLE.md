# connector-map — portable install

## Cursor

1. Copy `skills/connector-map/` into your OS repo (or `~/.cursor/skills/connector-map/`).
2. Point `--mcp-file` at your MCP config (Cursor: `~/.cursor/mcp.json`).
3. Say: **“Map my connectors.”**

## Claude Code / other hosts

Same script. Pass the JSON file that lists MCP servers (`mcpServers` object).

## Rules

- Inventory is names + verb suggestions. Never dump secrets.
- Send is never enabled by this skill.
- Plugin MCPs that live outside that JSON are `could_not_verify` until you add a file path.
