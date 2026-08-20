# Meta-patterns — structure and speed

Recurring antipatterns. Each was learned the expensive way (retries, hung sessions, 10× too much data). Scan this **before** you design a pipeline.

Strip the original domain. The *shape* still applies to Cursor, Claude Code, Codex, ChatGPT-with-MCP, Gemini CLI, and custom agents in 2026.

**How to use:** if a detection line matches your plan, apply the fix before you write code.

---

### MP-1 — Agent-as-middleman
The agent’s only job is calling the same tool in a loop. LLM inference + routing adds seconds per item.
**Detect:** >5 sequential identical tool calls.
**Fix:** a script or batch API. Browser click-loops → call the platform API / DOM evaluate instead of the actionability engine.
**Typical win:** 10–20×.

### MP-2 — Schema-from-memory
SQL, API fields, or configs written from the model’s memory. Wrong names → error → retry spiral.
**Detect:** tool_calls > 3× expected; >50% of calls are error-recovery.
**Fix:** read the validated artifact *and inject the excerpt into the prompt*. “Go read file X” is not the same as giving it the content.

### MP-3 — Discovery-before-action
Searching for IDs, channels, tables, endpoints the system already knows.
**Detect:** first 2–3 calls are `list_*` / `search_*` / `describe_*`.
**Fix:** inject known IDs into the prompt / skill. Discovery is for unknowns.

### MP-4 — Pull-everything-filter-later
Start from the largest table, filter in memory.
**Detect:** records_processed ≫ records_needed.
**Fix:** invert — start from the small needed set (open tasks, today’s queue), enrich outward.

### MP-5 — Sequential-when-independent
Phases that don’t share data run one after another.
**Detect:** wall clock ≈ sum(phases) instead of ≈ max(phases).
**Fix:** launch independent work in **one turn** (subagents or parallel tool calls).

### MP-6 — UI-loop-over-batch-API
Playwright/computer-use visits N pages for the same action. The product has `update_many` / a GraphQL mutation.
**Detect:** same UI action on each of N items.
**Fix:** one batch call. Win is often 50–500× (page-load × N).

### MP-7 — Compute-then-ship-without-validate
Classifications, %, tiers computed then posted. Validation is milliseconds; a wrong sheet is hours.
**Detect:** batch output goes to Slack/Sheets/email with no re-check against definitions.
**Fix:** for each row, re-apply the definition. Flag mismatches. Do not ship the mismatches.

### MP-8 — Batch-without-preflight
Send loop starts; item 17 is missing a phone / id / URL.
**Detect:** first items succeed, later INVALID_ARGUMENT / empty field.
**Fix:** one preflight query resolving **all** required fields. Filter incomplete. Report skip count. Then send.

### MP-9 — Build-outside-canonical-home
“Build X” interpreted as a parallel app, when X already has an owned home in the real product.
**Detect:** new stack that cannot share production state.
**Fix:** ask where it must live to *ship*. Mirrors are OK for “something to click”; products go to the canonical repo.

### MP-10 — Parallel-research-with-injected-context
Compound of MP-3 + MP-5: spawn workers *and* make them rediscover.
**Fix:** fan-out **with** the excerpts/IDs already in the packet.

### MP-11 — Source-reading-over-capture
Treating a HAR / screenshot / stale dump as live truth.
**Fix:** prefer live API / UI / query. Captures are clues, not SoT.

### MP-12 — Missing singleton for long-lived process
Each call opens a new DB/HTTP client in a daemon.
**Fix:** one client per process. Connection storms look like “the API is flaky.”

### MP-13 — Requirements-traceability-before-done
Shipped without mapping each acceptance line to evidence (test, screenshot, query).
**Fix:** a checklist: criterion → proof. Factory gap reports exist for this.

### MP-14 — Gateway-discovery-tax
`search_tools` / full schema fetch on every hot-path call.
**Fix:** a 15–20 alias hot list. Search is for the long tail.

### MP-15 — Subagent-re-engagement-chatter
Re-dispatching a worker to “continue” instead of synthesizing.
**Fix:** one shot, tight return contract, parent finishes. Resume only if the worker is still the right owner.

### MP-16 — Staged ≠ validated
A change sitting in a review queue is reported as “done” or “true in production.”
**Fix:** say `staged`. Validated means live modality + eval gate passed.

### MP-17 — Router-injection-steals-skill-load
The intent hook injects so much text that the model never reads `SKILL.md`.
**Fix:** router returns **skill name + one line**. The skill file is the body.

---

## Detection checklist (planning)

- [ ] Loop of identical tool calls? → MP-1 / MP-6
- [ ] Writing SQL/API from memory? → MP-2
- [ ] First calls are search/list? → MP-3
- [ ] Broad pull then filter? → MP-4
- [ ] Independent work serial? → MP-5 / MP-10
- [ ] Batch send with no field preflight? → MP-8
- [ ] Classifications ship without re-check? → MP-7
- [ ] Browser where an API exists? → MP-6 + API-before-browser
- [ ] Hot path going through search_tools? → MP-14
- [ ] Subagents chatting back and forth? → MP-15
