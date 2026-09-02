---
name: career-loop
description: >-
  Portable job-hunt OS after the core loop: wow-only scout contract, packet
  freeze, fail-closed quality gate, human approve, proof. Triggers: career
  loop, job hunt OS, package a role, quality-gate my packet, wow-only apply.
  Do not use for first-visit welcome, inspect-os, connector-map, or sending
  applications without explicit approve.
---

# career-loop

**When to use:** the operator wants a job-hunt loop that fails closed: scout wow-only, freeze a packet, gate resume/cover, wait for human approve, then submit/proof. Phrases: “career loop”, “package this role”, “run the quality gate”, “wow-only apply”.

**When not to use:** Enter the dojo / WELCOME; Door B folder inspect (`inspect-os`); MCP inventory (`connector-map`); identity interview (`operator-profile`); auto-send LinkedIn or ATS submit.

## Intent / Done / Boundaries

1. **Intent** — one role at a time, with a packet the operator can defend.
2. **Done** — `career-quality-gate.js` reports `PASS` on markdown; operator names approve before any send.
3. **Boundaries** — draft ≠ send. No invented hiring managers (`could_not_verify`). No 1-page resume. No company-explainer cover. Do not copy someone else's gold resume or private queue into Git.

## Packet shape

```text
packet/
  freeze/people-research.md
  build/resume.md
  build/cover.md
```

`cover-letter.md` is an allowed alias for `cover.md`.

## Procedure

1. Confirm you read **this** file. Restate Intent / Done / Boundaries.
2. Confirm they have a fit file of their own (do not copy someone else's). Scout wow-only against that file. One Contender per session.
3. Write `freeze/people-research.md` **before** the cover. HM + recruiter: named source or `could_not_verify`.
4. Draft resume + cover in `build/`. Load `references/writing-doctrine.md`.
5. Run (do not rebuild the gate in chat):

```bash
node skills/career-loop/scripts/career-quality-gate.js --packet <packetRoot> --md-only --no-write
```

6. FAIL → fix the packet; do not stamp READY. PASS → show the card with `send_allowed: false`; wait for **approve submit** (or their named approve) before any portal send.
7. LinkedIn just-applied notes are drafts until they say send. The gate never sends.

## Failures to refuse

- 1-pager / missing `## Skills` / skinny word count
- Cover that opens as a company explainer or uses the stock AI-seller slogan
- Cover that quotes their family/volunteering (dossier)
- Agent working notes in the letter
- Em dash (U+2014) in resume or cover (date en-dashes OK)
- Named HM/recruiter with no source (use `could_not_verify`)
- Claiming an application was sent without proof
- Auto-apply / portal spray

## Verify

```bash
node skills/career-loop/scripts/run-acceptance.js
```
