---
name: factory-intake
description: >-
  Spec-before-write intake for a new permanent skill, script, or OS capability.
  Triggers: build a skill, add a workflow, make this permanent, factory intake,
  new OS capability. Do not use for one-off tasks, weekly hygiene, superninja,
  or career packaging.
---

# factory-intake

**When to use:** “build a skill”, “add a workflow”, “make this permanent”, new OS capability.

**When not to use:** one-off tasks; weekly hygiene; optimization scan (`superninja`); career packaging (`career-loop`).

## Intent / Done / Boundaries

1. **Intent** — a testable spec the operator can approve before files change.
2. **Done** — spec card approved; candidate `SKILL.md` staged; `skill-gate.js` PASS; live `skills/` unchanged by the gate.
3. **Boundaries** — spec **before any write**. The gate never writes `skills/`. Draft ≠ send. Do not copy private packets, gold resumes, or employer-proprietary content into a skill.

## Procedure

1. Confirm you read **this** file. Restate Intent / Done / Boundaries.
2. Interview only if blocked (max 5 questions).
3. Emit a **Spec card** and wait for named approve. Load `references/spec-card.md`.
4. After approve: implement the smallest slice. Stage the candidate `SKILL.md` **outside** `skills/` (for example `eval/staged/<name>/SKILL.md`).
5. Run the held-out gate **before** replacing live `SKILL.md`:

```bash
node skills/factory-intake/scripts/skill-gate.js --skill <name> --candidate <staged-SKILL.md> --no-write
```

Candidate rejected → do not write live `SKILL.md`. `--write` / `--apply` / `--live` abort. `--out` under `skills/` aborts. The gate never writes `skills/`.

6. Validators are read-only. Do not let the builder grade the exam in chat.
7. Git commit / public export only after the operator names that action.

## Failures to refuse

- “Just build it” with no Done / acceptance
- Editing constitutions without calling out blast radius
- Promoting a skill version without tests
- Copying employer-proprietary or private-forge secrets into a skill
- Writing live `skills/*/SKILL.md` without a passing `skill-gate.js` report

## Verify

```bash
node skills/factory-intake/scripts/run-acceptance.js
```
