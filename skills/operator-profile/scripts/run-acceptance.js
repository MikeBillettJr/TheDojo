#!/usr/bin/env node
/**
 * Binary acceptance for operator-profile lint.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '../../..');
const FIX = path.join(REPO, 'eval', 'operator-profile', 'fixtures');
const LINT = path.join(__dirname, 'lint-profile.js');

function runLint(dir) {
  const proc = spawnSync(process.execPath, [LINT, '--dir', dir], { encoding: 'utf8' });
  if (!proc.stdout) throw new Error(proc.stderr || 'lint-profile failed');
  return JSON.parse(proc.stdout);
}

function check(name, pass, detail) {
  return { name, pass: !!pass, detail: detail || '' };
}

function main() {
  const checks = [];

  const good = runLint(path.join(FIX, 'good'));
  checks.push(check('good-profile', good.pass === true, JSON.stringify(good.errors)));

  const badSecret = runLint(path.join(FIX, 'bad-secret'));
  checks.push(
    check(
      'bad-secret',
      badSecret.pass === false && badSecret.errors.some((e) => /secret/i.test(e)),
      JSON.stringify(badSecret.errors)
    )
  );

  const badSections = runLint(path.join(FIX, 'bad-missing-sections'));
  checks.push(
    check(
      'bad-missing-sections',
      badSections.pass === false && badSections.errors.some((e) => /missing required section/i.test(e)),
      JSON.stringify(badSections.errors)
    )
  );

  const skill = fs.readFileSync(path.join(REPO, 'skills', 'operator-profile', 'SKILL.md'), 'utf8');
  checks.push(
    check(
      'skill-contract',
      /3 questions per turn/i.test(skill) &&
        /CONFLICT/i.test(skill) &&
        /lint-profile\.js/.test(skill) &&
        !/sk-/.test(skill),
      'interview + conflict + lint; no secrets in skill body'
    )
  );

  const pass = checks.every((c) => c.pass);
  console.log(JSON.stringify({ pass, checks }, null, 2));
  process.exit(pass ? 0 : 1);
}

main();
