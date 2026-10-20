---
name: os-201
description: >-
  Invitation-only kata after os-101: one tool call beats a guess. Read status,
  then the fact. Refuse pay, checkout, and apply. A pass unlocks the Tesla
  tool as a local clone of two folders. Triggers: invited 201, One call, next
  practice after 101. Do not use on first visit, before 101, or to copy a tool.
---

# os-201 — One call

**When to use:** `dojo-training` or os-101 named 201 and the operator said yes.

**When not to use:**
- First visit / Enter the dojo / look around
- Before 101
- Copying the Tesla tool into place (the pass card tells them to clone two folders onto their own computer when those folders exist)
- Awarding a belt for a pass

## Intent / Done / Boundaries

1. **Intent** — the operator can say why one tool call beats a guess, and can read an envelope.
2. **Done** — exam JSON `pass: true`, `unlock: tesla`, `hosted: false`, `wrote: false`, `belt_credit: false`. The card names two folders and their own computer.
3. **Boundaries** — fixture only. No live site. No browser. TheDojo does not run the tool for them.

## Procedure

1. Confirm you read **this** file. Restate Intent / Done / Boundaries.
2. If they were not invited, or 101 is not done, stop. Send them to 101.
3. Teach three beats, then run the exam. Do not invent a price.

```bash
node skills/os-201/scripts/os-201.js --mode exam
```

4. Show `card` when `pass` is true. `install` stays `choice`. They clone `tools/tesla-mcp` and `tools/mcp-kit` onto their own computer and point their AI host at the local command. If `tool_present` is false, say the clone waits.
5. “Place the order” stays refused. Do not unlock on that path:

```bash
node skills/os-201/scripts/os-201.js --mode order
```

## The three beats

1. **The guess.** A question about a public page. A chat answer has no source and no time.
2. **The call.** One tool returns `status`, `data`, `as_of`, and `source`. Read `status` first. `ok` means say the fact, the source, and the time. `could_not_verify` means stop with no number.
3. **The stop.** Pay, checkout, and apply are refused.

## Failures to refuse

- Running on first visit or before 101
- Inventing a price that is not in `data`
- Answering a `could_not_verify` envelope with a dollar amount
- Placing an order, paying, or applying
- Saying TheDojo runs the tool for them
- Calling the tool a server in the card
- Writing memory or awarding a belt
- Copying the tool folders in this step

## Verify

```bash
node skills/os-201/scripts/run-acceptance.js
```
