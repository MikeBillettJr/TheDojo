#!/usr/bin/env node
/**
 * Binary acceptance for dojo-training invite cards.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

function findRepo(start) {
  let dir = start;
  for (let i = 0; i < 10; i += 1) {
    if (fs.existsSync(path.join(dir, 'eval', 'cases', 'HARD-cases.md'))) return dir;
    dir = path.resolve(dir, '..');
  }
  throw new Error('dojo-training: repo root not found');
}

const HERE = __dirname;
const REPO = findRepo(HERE);
const SCRIPT = path.join(HERE, 'invite-training.js');
const SKILL = path.join(HERE, '..', 'SKILL.md');
const GOOD = path.join(REPO, 'eval', 'inspect-os', 'fixtures', 'existing-good');
const SECRET = path.join(REPO, 'eval', 'inspect-os', 'fixtures', 'existing-secret');
const TOKEN = 'sk-EXAMPLE_NOT_REAL';

function check(name, pass, detail) {
  return { name, pass: !!pass, detail: detail || '' };
}

function fingerprint(dir) {
  const rows = [];
  function walk(abs, rel) {
    const entries = fs.readdirSync(abs, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const nextAbs = path.join(abs, entry.name);
      const nextRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(nextAbs, nextRel);
      else {
        const buf = fs.readFileSync(nextAbs);
        const hash = crypto.createHash('sha256').update(buf).digest('hex');
        rows.push(`${nextRel}:${buf.length}:${hash}`);
      }
    }
  }
  walk(dir, '');
  return rows.join('\n');
}

function runInvite(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    cwd: REPO,
  });
}

function parseReport(proc) {
  if (!proc.stdout) return { error: proc.stderr || 'no stdout' };
  try {
    return JSON.parse(proc.stdout);
  } catch (e) {
    return { error: e.message, raw: proc.stdout };
  }
}

function lessonIdsIn(obj) {
  const blob = JSON.stringify(obj);
  return ['101', '201', '301', '401', '501'].filter((id) => blob.includes(id));
}

function main() {
  const checks = [];

  const coldProc = runInvite(['--mode', 'cold']);
  const cold = parseReport(coldProc);
  const coldIds = lessonIdsIn(cold);
  checks.push(check(
    'cold-no-catalog',
    coldProc.status === 0
      && cold.invited === false
      && cold.catalog === false
      && Array.isArray(cold.next)
      && cold.next.length === 0
      && coldIds.length === 0,
    JSON.stringify(cold)
  ));

  const doorAProc = runInvite(['--mode', 'door_a']);
  const doorA = parseReport(doorAProc);
  checks.push(check(
    'door-a-invites-101-only',
    doorAProc.status === 0
      && doorA.invited === true
      && Array.isArray(doorA.next)
      && doorA.next.length === 1
      && doorA.next[0] === '101'
      && doorA.unlock === 'choice'
      && doorA.exam_required === true
      && doorA.belt_credit === false
      && !lessonIdsIn(doorA).includes('501'),
    JSON.stringify(doorA)
  ));

  const beforeGood = fingerprint(GOOD);
  const goodProc = runInvite(['--mode', 'door_b', '--root', GOOD]);
  const good = parseReport(goodProc);
  const afterGood = fingerprint(GOOD);
  checks.push(check(
    'door-b-good-choice-not-credit',
    goodProc.status === 0
      && good.invited === true
      && good.unlock === 'choice'
      && good.exam_required === true
      && good.belt_credit === false
      && Array.isArray(good.practiced)
      && good.practiced.includes('101')
      && good.practiced.includes('301')
      && Array.isArray(good.next)
      && good.next.length <= 2
      && good.next.includes('201')
      && good.next.includes('401')
      && good.catalog === false,
    JSON.stringify(good)
  ));
  checks.push(check('door-b-good-no-write', beforeGood === afterGood, 'good fixture bytes changed'));

  const beforeSecret = fingerprint(SECRET);
  const secretProc = runInvite(['--mode', 'door_b', '--root', SECRET]);
  const secret = parseReport(secretProc);
  const secretOut = `${secretProc.stdout || ''}\n${secretProc.stderr || ''}`;
  const afterSecret = fingerprint(SECRET);
  checks.push(check(
    'door-b-secret-101-first',
    secretProc.status === 0
      && Array.isArray(secret.next)
      && secret.next[0] === '101'
      && !(Array.isArray(secret.practiced) && secret.practiced.includes('101'))
      && !secretOut.includes(TOKEN)
      && secret.exam_required === true
      && secret.belt_credit === false,
    JSON.stringify(secret)
  ));
  checks.push(check('door-b-secret-no-write', beforeSecret === afterSecret, 'secret fixture bytes changed'));

  const afterA = path.join(HERE, 'after-door-a.js');
  const afterProc = spawnSync(process.execPath, [afterA], { encoding: 'utf8', cwd: REPO });
  let afterCard = {};
  try {
    afterCard = JSON.parse(afterProc.stdout || '{}');
  } catch (e) {
    afterCard = { error: e.message };
  }
  const after101Proc = runInvite(['--mode', 'after_101']);
  const after101 = parseReport(after101Proc);
  checks.push(check(
    'after-101-invites-201-only',
    after101Proc.status === 0
      && after101.invited === true
      && Array.isArray(after101.next)
      && after101.next.length === 1
      && after101.next[0] === '201'
      && Array.isArray(after101.practiced)
      && after101.practiced.includes('101')
      && after101.unlock === 'choice'
      && after101.exam_required === true
      && after101.belt_credit === false
      && after101.catalog === false,
    JSON.stringify(after101)
  ));

  checks.push(check(
    'door-a-after-hook',
    afterProc.status === 0
      && afterCard.invited === true
      && Array.isArray(afterCard.next)
      && afterCard.next.length === 1
      && afterCard.next[0] === '101'
      && afterCard.belt_credit === false,
    JSON.stringify(afterCard)
  ));

  const doorASkill = path.join(REPO, 'skills', 'operator-profile', 'SKILL.md');
  const doorAText = fs.existsSync(doorASkill) ? fs.readFileSync(doorASkill, 'utf8') : '';
  checks.push(check(
    'door-a-skill-hook',
    /after-door-a\.js/.test(doorAText)
      && /invite/i.test(doorAText)
      && /101/.test(doorAText)
      && /catalog/i.test(doorAText),
    'operator-profile missing after-door-a hook'
  ));

  const skill = fs.readFileSync(SKILL, 'utf8');
  checks.push(check(
    'skill-invite-only',
    /When not to use/i.test(skill)
      && /first visit/i.test(skill)
      && /catalog/i.test(skill)
      && /exam_required/i.test(skill)
      && /choice/i.test(skill),
    'missing when-not / catalog / exam / choice'
  ));

  const pass = checks.every((c) => c.pass);
  process.stdout.write(`${JSON.stringify({ pass, checks }, null, 2)}\n`);
  process.exit(pass ? 0 : 1);
}

main();
