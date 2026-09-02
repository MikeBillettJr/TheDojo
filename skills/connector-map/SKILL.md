---
name: connector-map
description: >-
  Map the operator's existing MCP / connector config into OS verbs without
  leaking secrets. Triggers: map my connectors, what can my AI reach, MCP
  inventory, connector map, wire tools to draft-not-send. Do not use for
  Door B folder inspect (inspect-os), first-visit welcome, identity interview,
  or sending mail/messages.
---

# connector-map

**When to use:** “map my connectors”, “what can my AI already reach?”, MCP inventory, wire tools to OS verbs.

**When not to use:** Door B folder inspect (`inspect-os`); Enter the dojo / WELCOME; operator-profile; superninja; actually sending email or posting (draft ≠ send).

## Intent / Done / Boundaries

1. **Intent** — name installed MCP servers and the safest OS verb for each (read / draft). Send stays gated.
2. **Done** — JSON inventory: server names, transport, env **key names only**, suggested verb, `send_allowed: false`.
3. **Boundaries** — never print tokens, env values, or private URLs with credentials. `recommend_only`. Do not write `mcp.json` or `memory/connectors.md` unless the operator names that write. Missing config → `could_not_verify`, do not invent servers.

## Procedure

1. Confirm you read **this** file. Restate Intent / Done / Boundaries.
2. Run (do not rebuild in chat):

```bash
node skills/connector-map/scripts/connector-map.js --mcp-file <path-to-mcp.json>
```

Default file if they have Cursor: `%USERPROFILE%\.cursor\mcp.json` (or `~/.cursor/mcp.json`).

3. Show the card. Every row is **read** or **draft**. Never **send**.
4. Marketplace / plugin MCPs not in that file → list as `could_not_verify` (not invented).
5. Do not edit `mcp.json`. Draft a `memory/connectors.md` only after they name that file.

Load `references/verb-map.md` only if a new server name needs a verb rule.

## Failures to refuse

- Echoing API tokens, client secrets, or env **values**
- Auto-send / claiming a message was sent
- Inventing connectors not in the scanned file
- Overwriting `mcp.json`
- Treating this as inspect-os (folder inventory) or operator-profile

## Verify

```bash
node skills/connector-map/scripts/run-acceptance.js
```
