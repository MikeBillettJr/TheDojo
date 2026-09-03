# dojo-training — portable install

Invitation-only. Setup is not knowledge. Practiced files are not a belt.

## Cursor

Copy `skills/dojo-training/` into the OS repo (or `~/.cursor/skills/dojo-training/`).

After Door A profile Done, or after Door B inspect:

```bash
node skills/dojo-training/scripts/invite-training.js --mode door_a
node skills/dojo-training/scripts/invite-training.js --mode door_b --root <their-os-folder>
```

Cold clone / first visit:

```bash
node skills/dojo-training/scripts/invite-training.js --mode cold
```

## Rules

- Never dump 101–501.
- `unlock` is choice. `exam_required` stays true. `belt_credit` stays false.
- The script never writes memory or skills.
