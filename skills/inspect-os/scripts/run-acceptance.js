#!/usr/bin/env node
/**
 * Binary acceptance for inspect-os (Door B).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '../../..');
const FIX = path.join(REPO, 'eval', 'inspect-os', 'fixtures');
const SCRIPT = path.join(__dirname, 'inspect-os.js');
const SKILL = path.join(REPO, 'skills', 'inspect-os', 'SKILL.md');
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

function runInspect(dir) {
  return spawnSync(process.execPath, [SCRIPT, '--root', dir], {
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

function main() {
  const checks = [];
  const blankDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'inspect-os-blank-'));

  const blankProc = runInspect(blankDir);
  const blank = parseReport(blankProc);
  checks.push(check(
    'blank-slate-door-a',
    blankProc.status === 0
      && blank.kind === 'blank_slate'
      && blank.recommend === 'door_a'
      && blank.wrote === false,
    JSON.stringify(blank)
  ));

  const goodDir = path.join(FIX, 'existing-good');
  const beforeGood = fingerprint(goodDir);
  const goodProc = runInspect(goodDir);
  const good = parseReport(goodProc);
  const afterGood = fingerprint(goodDir);
  checks.push(check(
    'existing-good-inventory',
    goodProc.status === 0
      && good.kind === 'existing'
      && good.recommend === 'door_b'
      && good.found
      && good.found.root_files
      && good.found.root_files['AGENTS.md'] === true
      && good.found.memory
      && good.found.memory['PROFILE.md'] === true
      && Array.isArray(good.found.skills)
      && good.found.skills.includes('demo-skill')
      && good.wrote === false
      && good.recommend_only === true,
    JSON.stringify(good)
  ));
  checks.push(check('existing-good-no-write', beforeGood === afterGood, 'fixture bytes changed'));

  const secretDir = path.join(FIX, 'existing-secret');
  const beforeSecret = fingerprint(secretDir);
  const secretProc = runInspect(secretDir);
  const secretOut = `${secretProc.stdout || ''}\n${secretProc.stderr || ''}`;
  const afterSecret = fingerprint(secretDir);
  checks.push(check(
    'existing-secret-redacted',
    secretProc.status === 0 && !secretOut.includes(TOKEN),
    secretOut.slice(0, 400)
  ));
  checks.push(check('existing-secret-no-write', beforeSecret === afterSecret, 'secret fixture bytes changed'));

  const skill = fs.readFileSync(SKILL, 'utf8');
  checks.push(check(
    'skill-when-not-and-welcome',
    /When not to use/i.test(skill)
      && /operator-profile/i.test(skill)
      && /(enter-the-dojo|WELCOME)/i.test(skill)
      && /never overwrite/i.test(skill)
      && /recommend_only/i.test(skill),
    'missing when-not / welcome / overwrite / recommend_only'
  ));

  try {
    fs.rmSync(blankDir, { recursive: true, force: true });
  } catch (e) {
    // ignore tmp cleanup
  }

  const pass = checks.every((c) => c.pass);
  process.stdout.write(`${JSON.stringify({ pass, checks }, null, 2)}\n`);
  process.exit(pass ? 0 : 1);
}

main();
