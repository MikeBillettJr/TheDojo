#!/usr/bin/env node
/**
 * Binary acceptance for os-201 One call.
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
  throw new Error('os-201: repo root not found');
}

const HERE = __dirname;
const REPO = findRepo(HERE);
const SCRIPT = path.join(HERE, 'os-201.js');
const SKILL = path.join(HERE, '..', 'SKILL.md');
const FIX = path.join(REPO, 'eval', 'os-201', 'fixtures');

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

function run(args) {
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

function main() {
  const checks = [];
  const before = fingerprint(FIX);
  const examProc = run(['--mode', 'exam']);
  const exam = parseReport(examProc);
  const after = fingerprint(FIX);
  const out = `${examProc.stdout || ''}\n${examProc.stderr || ''}`;
  const card = Array.isArray(exam.card) ? exam.card.join('\n') : '';

  checks.push(check(
    'exam-pass-one-price',
    examProc.status === 0
      && exam.pass === true
      && exam.answers
      && exam.answers.ok.pass === true
      && exam.answers.ok.said.includes('39990')
      && exam.answers.ok.said.includes('tesla.com')
      && exam.answers.ok.said.split('39990').length === 2
      && exam.answers.miss.pass === true
      && !/\$/.test(exam.answers.miss.said)
      && exam.answers.order.refused === true
      && exam.wrote === false
      && exam.belt_credit === false
      && exam.hosted === false
      && exam.unlock === 'tesla',
    JSON.stringify(exam).slice(0, 500)
  ));
  checks.push(check(
    'card-local-two-folders',
    card.includes('your own computer')
      && card.includes('two folders')
      && card.includes('tools/tesla-mcp')
      && card.includes('tools/mcp-kit')
      && card.includes('TheDojo does not run this for you.')
      && card.includes('not in this repo yet')
      && !/server/i.test(card)
      && exam.tool_present === false
      && Array.isArray(exam.clone)
      && exam.clone.length === 2,
    card
  ));
  checks.push(check('exam-no-write', before === after, 'fixture bytes changed'));
  checks.push(check(
    'no-private-markers',
    !/OurDojo|MasterDojo|33155|Users\\\\micha/i.test(out),
    out.slice(0, 200)
  ));

  const orderProc = run(['--mode', 'order']);
  const order = parseReport(orderProc);
  checks.push(check(
    'order-refuses-without-unlock',
    orderProc.status === 0
      && order.refused === true
      && order.unlock === null
      && order.hosted === false
      && order.wrote === false,
    JSON.stringify(order)
  ));

  const skill = fs.readFileSync(SKILL, 'utf8');
  checks.push(check(
    'skill-after-101',
    /When not to use/i.test(skill)
      && /101/.test(skill)
      && /first visit/i.test(skill)
      && /two folders/i.test(skill)
      && /own computer/i.test(skill)
      && /belt/i.test(skill),
    'missing when-not / 101 / local clone'
  ));

  const pass = checks.every((c) => c.pass);
  process.stdout.write(`${JSON.stringify({ pass, checks }, null, 2)}\n`);
  process.exit(pass ? 0 : 1);
}

main();
