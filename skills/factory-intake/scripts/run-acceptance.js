#!/usr/bin/env node
/**
 * Binary acceptance for factory-intake (portable skill-gate).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '../../..');
const FIX = path.join(REPO, 'eval', 'factory-intake', 'fixtures');
const SCRIPT = path.join(__dirname, 'skill-gate.js');
const SKILL = path.join(REPO, 'skills', 'factory-intake', 'SKILL.md');
const OS_ROOT = path.join(FIX, 'os-root');
const LIVE = path.join(OS_ROOT, 'skills', 'demo-skill', 'SKILL.md');

function check(name, pass, detail) {
  return { name, pass: !!pass, detail: detail || '' };
}

function fingerprint(file) {
  if (!fs.existsSync(file)) return 'missing';
  const buf = fs.readFileSync(file);
  return `${buf.length}:${crypto.createHash('sha256').update(buf).digest('hex')}`;
}

function runGate(extra) {
  return spawnSync(process.execPath, [SCRIPT, ...extra], {
    encoding: 'utf8',
    cwd: REPO,
  });
}

function parseReport(proc) {
  const text = `${proc.stdout || ''}`;
  if (!text.trim()) return { error: proc.stderr || 'no stdout' };
  try {
    return JSON.parse(text);
  } catch (e) {
    return { error: e.message, raw: text.slice(0, 400) };
  }
}

function main() {
  const checks = [];
  const before = fingerprint(LIVE);

  const goodProc = runGate([
    '--root', OS_ROOT,
    '--skill', 'demo-skill',
    '--candidate', path.join(FIX, 'candidate-good', 'SKILL.md'),
    '--no-write',
  ]);
  const good = parseReport(goodProc);
  checks.push(check(
    'good-candidate-pass',
    goodProc.status === 0
      && good.pass === true
      && good.kind === 'revision'
      && good.wrote === false
      && good.send_allowed === false
      && good.candidate
      && good.candidate.rejected === false,
    JSON.stringify(good)
  ));
  checks.push(check('good-no-write-live', before === fingerprint(LIVE), 'demo-skill live bytes changed'));

  const badProc = runGate([
    '--root', OS_ROOT,
    '--skill', 'demo-skill',
    '--candidate', path.join(FIX, 'candidate-regressed', 'SKILL.md'),
    '--no-write',
  ]);
  const bad = parseReport(badProc);
  checks.push(check(
    'regressed-rejected',
    badProc.status !== 0
      && bad.pass === false
      && bad.candidate
      && bad.candidate.rejected === true
      && bad.wrote === false,
    JSON.stringify(bad)
  ));
  checks.push(check('regressed-no-write-live', before === fingerprint(LIVE), 'demo-skill live bytes changed on reject'));

  const writeProc = runGate([
    '--root', OS_ROOT,
    '--skill', 'demo-skill',
    '--write',
  ]);
  const writeRep = parseReport(writeProc);
  checks.push(check(
    'write-flag-abort',
    writeProc.status !== 0 && writeRep.abort === true && writeRep.wrote === false,
    JSON.stringify(writeRep)
  ));

  const outProc = runGate([
    '--root', OS_ROOT,
    '--skill', 'demo-skill',
    '--out', path.join(OS_ROOT, 'skills', 'demo-skill', 'SKILL.md'),
  ]);
  const outRep = parseReport(outProc);
  checks.push(check(
    'out-under-skills-abort',
    outProc.status !== 0 && outRep.abort === true,
    JSON.stringify(outRep)
  ));
  checks.push(check('out-abort-no-write-live', before === fingerprint(LIVE), 'demo-skill live bytes changed on --out abort'));

  const freshProc = runGate([
    '--root', OS_ROOT,
    '--skill', 'fresh-skill',
    '--candidate', path.join(FIX, 'candidate-new', 'SKILL.md'),
    '--no-write',
  ]);
  const fresh = parseReport(freshProc);
  checks.push(check(
    'new-skill-pass',
    freshProc.status === 0
      && fresh.pass === true
      && fresh.kind === 'new_skill'
      && fresh.wrote === false
      && !fs.existsSync(path.join(OS_ROOT, 'skills', 'fresh-skill')),
    JSON.stringify(fresh)
  ));

  const skill = fs.readFileSync(SKILL, 'utf8');
  checks.push(check(
    'skill-rails',
    /When not to use/i.test(skill)
      && /before any write/i.test(skill)
      && /skill-gate\.js/i.test(skill)
      && /never writes/i.test(skill)
      && /Spec card/i.test(skill),
    'missing factory-intake rails in SKILL.md'
  ));

  const allPass = checks.every((c) => c.pass);
  process.stdout.write(`${JSON.stringify({ pass: allPass, checks }, null, 2)}\n`);
  process.exit(allPass ? 0 : 1);
}

main();
