# Sanitization gate (OurDojo → TheDojo)

Every artifact in this repo passed this checklist. **Unknown provenance fails closed.**

## Required before any public write

1. **Explicit target** — maintainer names `TheDojo` for the exact files/commit.
2. **Content scan** — no personal/family details, employer-proprietary context, application materials, private metrics, credentials, tokens, or local usernames/paths.
3. **Independent review** — someone other than the builder runs acceptance tests (or a fresh agent tab grades HARD cases).
4. **Human diff approval** — operator sees the sanitized artifact or exact diff before push.

Label cleared exports: `CLEARED FOR THEDOJO` + reviewer + date in the commit message or export log.

## Automated checks (run from TheDojo root)

```bash
node skills/superninja/scripts/run-acceptance.js
```

Search the export tree for forbidden patterns:

```bash
# PowerShell example
rg -i "micha|Billett|OurDojo|MasterDojo|sk-|ghp_|C:\\\\Users" .
```

Expect zero hits (except this doc and fixture examples marked `EXAMPLE_NOT_REAL`).

## Replace when exporting

| Private (OurDojo) | Public (TheDojo) |
|-------------------|------------------|
| `OurDojo Git` | `Git repository (canonical)` |
| `ourdojo.superninja.*` schema | `thedojo.superninja.*` |
| Mike / family names | `the operator` |
| Hardcoded `C:\Users\...` paths | Placeholders in SKILL.md + PORTABLE.md |
| Personal voice / job-fit / packets | Omit entirely |
| masterninja / internal SIS stamps | Public SIS badge only (e.g. v2 Knowledge) |

## Never export

- `application-execute`, personal `job-scout`, `vault-library` with private vault paths
- Session transcripts, job packets, PROFILE/LESSONS from private memory
- Raw `history/sessions/` from OurDojo (summaries only, sanitized)

## Fresh git history

Prefer a **clean export folder** or squash commit for new skills — do not copy `.git` from OurDojo.
