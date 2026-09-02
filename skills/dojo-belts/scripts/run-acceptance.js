#!/usr/bin/env node
/**
 * Binary acceptance for dojo-belts.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '../../..');
const FIX = path.join(REPO, 'eval', 'dojo-belts', 'fixtures');
const SCRIPT = path.join(__dirname, 'dojo-belts.js');
const SKILL = path.join(REPO, 'skills', 'dojo-belts', 'SKILL.md');

function check(name, pass, detail) {
  return { name, pass: !!pass, detail: detail || '' };
}

function fingerprint(file) {
  if (!fs.existsSync(file)) return 'missing';
  const buf = fs.readFileSync(file);
  return `${buf.length}:${crypto.createHash('sha256').update(buf).digest('hex')}`;
}

function runBelts(extra) {
  return spawnSync(process.execPath, [SCRIPT, ...extra], {
    encoding: 'utf8',
    cwd: REPO,
  });
}

function parseReport(proc) {
  if (!proc.stdout) return { error: proc.stderr || 'no stdout' };
  try {
    return JSON.parse(proc.stdout);
  } catch (e) {
    return { error: e.message, raw: proc.stdout.slice(0, 400) };
  }
}

function hasForbiddenScore(text) {
  return /health_score|"ai_iq"|"iq"|health score|AI IQ/i.test(text)
    || /"score"\s*:/.test(text)
    || /"percent"\s*:/.test(text);
}

function main() {
  const checks = [];
  const allPath = path.join(FIX, 'all-pass.json');
  const beforeAll = fingerprint(allPath);
  const allProc = runBelts(['--from-json', allPath]);
  const all = parseReport(allProc);
  const allOut = `${allProc.stdout || ''}\n${allProc.stderr || ''}`;
  checks.push(check(
    'all-pass-black',
    allProc.status === 0
      && all.kind === 'mapped'
      && all.belt === 'black'
      && Array.isArray(all.earned)
      && all.earned[all.earned.length - 1] === 'black'
      && all.next === null
      && all.wrote === false
      && all.send_allowed === false,
    JSON.stringify(all)
  ));
  checks.push(check('all-pass-no-score', !hasForbiddenScore(allOut), allOut.slice(0, 300)));
  checks.push(check('all-pass-no-write', beforeAll === fingerprint(allPath), 'all-pass fixture changed'));

  const whitePath = path.join(FIX, 'white-only.json');
  const whiteProc = runBelts(['--from-json', whitePath]);
  const white = parseReport(whiteProc);
  checks.push(check(
    'white-only',
    whiteProc.status === 0
      && white.belt === 'white'
      && white.next === 'yellow'
      && JSON.stringify(white.earned) === JSON.stringify(['white']),
    JSON.stringify(white)
  ));

  const gapPath = path.join(FIX, 'skip-gap.json');
  const gapProc = runBelts(['--from-json', gapPath]);
  const gap = parseReport(gapProc);
  checks.push(check(
    'skip-gap-no-jump',
    gapProc.status === 0
      && gap.belt === 'white'
      && gap.next === 'yellow'
      && !gap.earned.includes('green')
      && !gap.earned.includes('brown'),
    JSON.stringify(gap)
  ));

  const missingProc = runBelts(['--from-json', path.join(FIX, 'no-such-verify.json')]);
  const missing = parseReport(missingProc);
  checks.push(check(
    'missing-could-not-verify',
    missingProc.status === 0
      && missing.kind === 'missing'
      && missing.could_not_verify === true
      && missing.belt === 'none'
      && missing.wrote === false,
    JSON.stringify(missing)
  ));

  const writeProc = runBelts(['--from-json', allPath, '--write']);
  const writeRep = parseReport(writeProc);
  checks.push(check(
    'write-flag-abort',
    writeProc.status !== 0 && writeRep.abort === true && writeRep.wrote === false,
    JSON.stringify(writeRep)
  ));

  const skill = fs.readFileSync(SKILL, 'utf8');
  checks.push(check(
    'skill-rails',
    /When not to use/i.test(skill)
      && /health score/i.test(skill)
      && /AI IQ/i.test(skill)
      && /verify-os/i.test(skill)
      && /consecutive/i.test(skill)
      && /could_not_verify/i.test(skill)
      && /never writes/i.test(skill)
      && /WELCOME/i.test(skill),
    'missing dojo-belts rails in SKILL.md'
  ));

  const allPass = checks.every((c) => c.pass);
  process.stdout.write(`${JSON.stringify({ pass: allPass, checks }, null, 2)}\n`);
  process.exit(allPass ? 0 : 1);
}

main();
