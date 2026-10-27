#!/usr/bin/env node
/**
 * os-201 One call. Read status, then the fact. Refuse pay, checkout, and apply.
 * Never writes. The next tool runs on the learner's computer.
 * This repo names placeholder folders only.
 *
 *   node os-201.js --mode exam
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SECRET_RE = /\b(sk-|ghp_|github_pat_|xox[baprs]-|BEGIN [A-Z ]+PRIVATE KEY)\S*/gi;
const DOLLAR_RE = /\$\s?\d|\b\d{2,}\b/;

function parseArgs(argv) {
  const out = { mode: 'exam' };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--mode') out.mode = argv[++i];
  }
  return out;
}

function findRepo(start) {
  let dir = start;
  for (let i = 0; i < 10; i += 1) {
    if (fs.existsSync(path.join(dir, 'eval', 'cases', 'HARD-cases.md'))) return dir;
    dir = path.resolve(dir, '..');
  }
  return null;
}

function redact(text) {
  return String(text).replace(SECRET_RE, '[REDACTED]');
}

function loadFixtures(repo) {
  const file = path.join(repo, 'eval', 'os-201', 'fixtures', 'envelopes.json');
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return null;
  }
}

function sayOk(env) {
  const price = env && env.data ? env.data.price : null;
  return {
    said: `The price is ${price}. Source ${env.source}. As of ${env.as_of}.`,
    price,
  };
}

function sayMiss() {
  return { said: 'Could not verify. No price.' };
}

function sayOrder() {
  return {
    refused: true,
    said: 'That stays stopped. The tool does not pay, check out, or apply.',
  };
}

function grade(fixtures) {
  const okEnv = fixtures.ok || {};
  const ok = sayOk(okEnv);
  const miss = sayMiss();
  const order = sayOrder();
  const okPass = okEnv.status === 'ok'
    && ok.price === 39990
    && ok.said.includes('tesla.com')
    && ok.said.includes(okEnv.as_of)
    && ok.said.split(String(ok.price)).length === 2;
  const missPass = fixtures.miss
    && fixtures.miss.status === 'could_not_verify'
    && !DOLLAR_RE.test(miss.said);
  const orderPass = order.refused === true
    && /pay|check out|apply/i.test(order.said);
  return {
    ok: { pass: !!okPass, said: ok.said },
    miss: { pass: !!missPass, said: miss.said },
    order: { pass: !!orderPass, said: order.said, refused: true },
    pass: !!(okPass && missPass && orderPass),
  };
}

function cardLines() {
  return [
    'You passed One call.',
    'Run the next tool on your own computer.',
    'Clone two folders you choose. This public repo does not name a private tool.',
    'The placeholders are tools/<your-tool> and tools/<your-kit>.',
    'Point your AI host at the local command.',
    'It reads a public page from your machine. One example is tesla.com.',
    'It can answer a page you can cite.',
    'It stops before pay, checkout, and apply.',
    'It does not sign you in, and it does not open a browser when a session starts.',
    'TheDojo does not run this for you.',
    'Those two folders are not in this repo. Add your own on your computer.',
  ];
}

function reportFor(mode) {
  const base = {
    schema: 'thedojo.os-201.v1',
    wrote: false,
    belt_credit: false,
    hosted: false,
    unlock: null,
    install: 'choice',
  };
  const repo = findRepo(__dirname);
  if (!repo) {
    return Object.assign(base, {
      pass: false,
      could_not_verify: 'repo root missing',
    });
  }
  const fixtures = loadFixtures(repo);
  if (!fixtures) {
    return Object.assign(base, {
      pass: false,
      could_not_verify: 'envelopes fixture missing',
    });
  }
  if (mode === 'order') {
    const order = sayOrder();
    return Object.assign(base, {
      mode: 'order',
      pass: false,
      refused: order.refused,
      said: order.said,
    });
  }
  if (mode !== 'exam') {
    return Object.assign(base, {
      pass: false,
      could_not_verify: 'mode must be exam or order',
    });
  }
  const graded = grade(fixtures);
  const out = Object.assign(base, {
    mode: 'exam',
    pass: graded.pass,
    answers: {
      ok: graded.ok,
      miss: graded.miss,
      order: graded.order,
    },
    tool_present: false,
    clone: ['tools/<your-tool>', 'tools/<your-kit>'],
  });
  if (graded.pass) {
    out.unlock = 'tesla';
    out.card = cardLines();
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv);
  const report = reportFor(args.mode);
  const raw = JSON.stringify(report);
  process.stdout.write(`${redact(raw)}\n`);
  if (report.could_not_verify) process.exit(1);
  process.exit(0);
}

main();
