#!/usr/bin/env node
/**
 * Binary acceptance for os-101.
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
  throw new Error('os-101: repo root not found');
}

const HERE = __dirname;
const REPO = findRepo(HERE);
const SCRIPT = path.join(HERE, 'os-101.js');
const SKILL = path.join(HERE, '..', 'SKILL.md');
const FIX = path.join(REPO, 'eval', 'os-101', 'fixtures', 'pieces-with-secret');
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

function runOs(args) {
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

function kinds(report) {
  return new Set((report.pieces || []).map((p) => p.kind));
}

function main() {
  const checks = [];
  const before = fingerprint(FIX);
  const labelProc = runOs(['--root', FIX]);
  const labeled = parseReport(labelProc);
  const after = fingerprint(FIX);
  const out = `${labelProc.stdout || ''}\n${labelProc.stderr || ''}`;
  const k = kinds(labeled);

  checks.push(check(
    'labels-pieces',
    labelProc.status === 0
      && k.has('skill')
      && k.has('script')
      && k.has('mcp')
      && k.has('workflow')
      && k.has('memory')
      && labeled.glossary
      && labeled.glossary.skill
      && labeled.glossary.secret,
    JSON.stringify(labeled)
  ));
  checks.push(check(
    'secret-redacted',
    labelProc.status === 0
      && labeled.secret_found === true
      && !out.includes(TOKEN)
      && labeled.wrote === false,
    out.slice(0, 400)
  ));
  checks.push(check('label-no-write', before === after, 'fixture bytes changed'));

  const saveBefore = fingerprint(FIX);
  const saveProc = runOs(['--root', FIX, '--mode', 'save-key']);
  const saved = parseReport(saveProc);
  const saveOut = `${saveProc.stdout || ''}\n${saveProc.stderr || ''}`;
  const saveAfter = fingerprint(FIX);
  checks.push(check(
    'save-key-refuses',
    saveProc.status === 0
      && saved.refuse === true
      && saved.wrote === false
      && !saveOut.includes(TOKEN),
    JSON.stringify(saved)
  ));
  checks.push(check('save-key-no-write', saveBefore === saveAfter, 'save-key wrote fixture'));

  const skill = fs.readFileSync(SKILL, 'utf8');
  checks.push(check(
    'skill-invite-only',
    /When not to use/i.test(skill)
      && /invited/i.test(skill)
      && /first visit/i.test(skill)
      && /save-key|secret store|PROFILE/i.test(skill),
    'missing when-not / invite / secrets'
  ));

  const pass = checks.every((c) => c.pass);
  process.stdout.write(`${JSON.stringify({ pass, checks }, null, 2)}\n`);
  process.exit(pass ? 0 : 1);
}

main();
