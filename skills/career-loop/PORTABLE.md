# career-loop — portable install

After the core OS loop (profile, memory, improve). This is the job-hunt kata.

## Cursor

1. Copy `skills/career-loop/` into your OS repo (or `~/.cursor/skills/career-loop/`).
2. Put one role in a packet folder: `freeze/people-research.md`, `build/resume.md`, `build/cover.md`.
3. Say: **“Run the career quality gate on this packet.”**

```bash
node skills/career-loop/scripts/career-quality-gate.js --packet <packetRoot> --md-only
```

## Rules

- Your fit file and resume gold stay on your machine. Do not commit packets with personal data.
- FAIL closed on skinny resumes and explainer covers.
- Send stays gated.
