# Sanitization gate (private forge → TheDojo)

Every artifact in this repo passed this checklist. **Unknown provenance fails closed.**

## Required before any public write

1. **Explicit target** — maintainer names `TheDojo` for the exact files/commit.
2. **Content scan** — no personal/family details, employer-proprietary context, application materials, private metrics, credentials, tokens, or local usernames/paths.
3. **Independent review** — someone other than the builder runs acceptance tests (or a fresh agent tab grades HARD cases).
4. **Human diff approval** — operator sees the sanitized artifact or exact diff before push.

Label cleared exports: `CLEARED FOR THEDOJO` + reviewer + date in the commit message or export log.

## Founder identity (allowed in named files only)

Mike approved 2026-08-30. These may appear in `README.md`, `docs/WELCOME.md`, and `scripts/enter-the-dojo.js`:

- Mike / Michael Billett Jr.
- Superdojo (the **name** of Mike's GitHub/system; no Superdojo source or company knowledge)
- Tesla (store productivity, web growth, sales ops, national training ops) as public career spine
- Opendoor as current sales leadership + production AI (no internal metrics)
- LinkedIn: `linkedin.com/in/michael-billett-jr`
- GitHub org: `BillettFamily`

Do **not** use a raw `micha` search: it matches `Michael`. Do **not** copy Superdojo source.

## Automated checks (run from TheDojo root)

```bash
node skills/superninja/scripts/run-acceptance.js
node scripts/enter-the-dojo.js --check
node scripts/verify-os.js
```

Forbidden patterns (expect zero hits outside this doc, LICENSE, and fixtures marked `EXAMPLE_NOT_REAL`):

```bash
rg -i "OurDojo|MasterDojo|sk-|ghp_|C:\\\\Users" .
rg -i "Users.micha" .
```

`Billett` / `Michael` in the founder files above are the carve-out, not a leak.

## Replace when exporting

| Private forge | Public (TheDojo) |
|---------------|------------------|
| Private git as SoT | Git repository (canonical) |
| private schema prefixes | `thedojo.*` |
| Family names / private identity | omit (founder name only in the files listed above) |
| Hardcoded `C:\Users\...` paths | Placeholders in SKILL.md + PORTABLE.md |
| Personal voice / job-fit / packets | Omit entirely |
| Internal SIS stamps | Public SIS badge only (e.g. v2 Knowledge) |

## Never export

- Personal job-scout / application-execute packets, private vault paths
- Session transcripts, job packets, private PROFILE/LESSONS
- Superdojo source, company knowledge, or internals (the name Superdojo is allowed)
- Raw private session history

## Fresh git history

Prefer a **clean export folder** or squash commit for new skills — do not copy `.git` from a private forge.
