#!/usr/bin/env node
/**
 * Binary acceptance for career-loop (portable quality gate).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '../../..');
const FIX = path.join(REPO, 'eval', 'career-loop', 'fixtures');
const SCRIPT = path.join(__dirname, 'career-quality-gate.js');
const SKILL = path.join(REPO, 'skills', 'career-loop', 'SKILL.md');

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

function runGate(packet, extra = ['--md-only', '--no-write']) {
  return spawnSync(process.execPath, [SCRIPT, '--packet', packet, ...extra], {
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

function failIds(report) {
  return (report.failures || []).map((f) => f.id);
}

function main() {
  const checks = [];
  const passDir = path.join(FIX, 'pass-packet');
  const beforePass = fingerprint(passDir);
  const passProc = runGate(passDir);
  const pass = parseReport(passProc);
  checks.push(check(
    'pass-packet',
    passProc.status === 0
      && pass.status === 'PASS'
      && pass.send_allowed === false
      && pass.schema === 'career-quality-gate.v1'
      && Array.isArray(pass.failures)
      && pass.failures.length === 0,
    JSON.stringify(pass)
  ));
  checks.push(check('pass-packet-no-write', beforePass === fingerprint(passDir), 'pass fixture bytes changed'));

  const skinnyDir = path.join(FIX, 'fail-skinny');
  const beforeSkinny = fingerprint(skinnyDir);
  const skinnyProc = runGate(skinnyDir);
  const skinny = parseReport(skinnyProc);
  const skinnyIds = failIds(skinny);
  checks.push(check(
    'fail-skinny',
    skinnyProc.status === 4
      && skinny.status === 'FAIL'
      && skinny.send_allowed === false
      && skinnyIds.includes('resume_word_floor')
      && skinnyIds.includes('cover_company_explainer_open'),
    JSON.stringify(skinny)
  ));
  checks.push(check('fail-skinny-no-write', beforeSkinny === fingerprint(skinnyDir), 'skinny fixture bytes changed'));

  const inventedDir = path.join(FIX, 'fail-invented');
  const beforeInvented = fingerprint(inventedDir);
  const inventedProc = runGate(inventedDir);
  const invented = parseReport(inventedProc);
  const inventedIds = failIds(invented);
  checks.push(check(
    'fail-invented-hm',
    inventedProc.status === 4
      && invented.status === 'FAIL'
      && invented.send_allowed === false
      && inventedIds.includes('people_research_invented'),
    JSON.stringify(invented)
  ));
  checks.push(check(
    'fail-invented-no-write',
    beforeInvented === fingerprint(inventedDir),
    'invented fixture bytes changed'
  ));

  const skill = fs.readFileSync(SKILL, 'utf8');
  checks.push(check(
    'skill-rails',
    /When not to use/i.test(skill)
      && /draft/i.test(skill)
      && /send_allowed:\s*false/i.test(skill)
      && /career-quality-gate/i.test(skill)
      && /could_not_verify/i.test(skill)
      && /wow-only/i.test(skill)
      && /people-research/i.test(skill)
      && /approve/i.test(skill),
    'missing career-loop rails in SKILL.md'
  ));

  const allPass = checks.every((c) => c.pass);
  process.stdout.write(`${JSON.stringify({ pass: allPass, checks }, null, 2)}\n`);
  process.exit(allPass ? 0 : 1);
}

main();
