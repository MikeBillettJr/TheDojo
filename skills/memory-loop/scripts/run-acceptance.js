#!/usr/bin/env node
/**
 * Binary acceptance for memory-loop lint.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '../../..');
const FIX = path.join(REPO, 'eval', 'memory-loop', 'fixtures');
const LINT = path.join(__dirname, 'lint-memory.js');

function runLint(dir) {
  const proc = spawnSync(process.execPath, [LINT, '--dir', dir], { encoding: 'utf8' });
  if (!proc.stdout) throw new Error(proc.stderr || 'lint-memory failed');
  return JSON.parse(proc.stdout);
}

function check(name, pass, detail) {
  return { name, pass: !!pass, detail: detail || '' };
}

function main() {
  const checks = [];

  const good = runLint(path.join(FIX, 'good'));
  checks.push(check('good-memory', good.pass === true, JSON.stringify(good.errors)));

  const bloated = runLint(path.join(FIX, 'bloated'));
  checks.push(
    check(
      'bloated-working',
      bloated.pass === false && bloated.errors.some((e) => /exceeds cap/i.test(e)),
      JSON.stringify(bloated.errors)
    )
  );

  const skill = fs.readFileSync(path.join(REPO, 'skills', 'memory-loop', 'SKILL.md'), 'utf8');
  checks.push(
    check(
      'skill-wrap-up',
      /wrap up/i.test(skill) && /stop \/ pause \/ wait/i.test(skill) && /lint-memory\.js/.test(skill),
      'wrap-up + stop distinction + lint'
    )
  );
  checks.push(
    check(
      'skill-working-cap',
      /~30 lines/i.test(skill) && /do not invent/i.test(skill),
      'cap + anti-fabrication'
    )
  );

  const pass = checks.every((c) => c.pass);
  console.log(JSON.stringify({ pass, checks }, null, 2));
  process.exit(pass ? 0 : 1);
}

main();
