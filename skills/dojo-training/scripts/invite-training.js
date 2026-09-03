#!/usr/bin/env node
/**
 * Invitation-only next-lesson card. Never dumps 101-501. Never writes.
 *
 *   node invite-training.js --mode cold
 *   node invite-training.js --mode door_a
 *   node invite-training.js --mode door_b --root <dir>
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SECRET_RE = /\b(sk-|ghp_|github_pat_|xox[baprs]-|BEGIN [A-Z ]+PRIVATE KEY)\S*/gi;
const MAX_NEXT = 2;

function parseArgs(argv) {
  const out = { mode: null, root: null };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--mode') out.mode = argv[++i];
    else if (argv[i] === '--root') out.root = argv[++i];
  }
  return out;
}

function existsFile(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile();
  } catch (e) {
    return false;
  }
}

function existsDir(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isDirectory();
  } catch (e) {
    return false;
  }
}

function readText(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (e) {
    return '';
  }
}

function lineCount(text) {
  if (!text) return 0;
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return (normalized.endsWith('\n') ? normalized.slice(0, -1) : normalized).split('\n').length;
}

function walkFiles(dir, acc, depth) {
  if (depth > 5 || !existsDir(dir)) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(next, acc, depth + 1);
    else acc.push(next);
  }
}

function scanRoot(root) {
  const memoryDir = path.join(root, 'memory');
  const skillsDir = path.join(root, 'skills');
  const hasProfile = existsFile(path.join(memoryDir, 'PROFILE.md'));
  const workingPath = path.join(memoryDir, 'WORKING.md');
  const hasWorking = existsFile(workingPath);
  const workingLines = hasWorking ? lineCount(readText(workingPath)) : 0;
  const hasLayout = existsFile(path.join(root, 'docs', 'LAYOUT.md'));
  const hasMcp = existsFile(path.join(root, 'mcp.json'))
    || existsFile(path.join(root, '.cursor', 'mcp.json'));
  let hasSkills = false;
  if (existsDir(skillsDir)) {
    try {
      hasSkills = fs.readdirSync(skillsDir).some((name) => (
        existsFile(path.join(skillsDir, name, 'SKILL.md'))
      ));
    } catch (e) {
      hasSkills = false;
    }
  }
  let secretFound = false;
  const files = [];
  walkFiles(memoryDir, files, 0);
  for (const file of files) {
    if (SECRET_RE.test(readText(file))) {
      secretFound = true;
      break;
    }
    SECRET_RE.lastIndex = 0;
  }
  return {
    hasProfile,
    hasWorking,
    workingLines,
    hasLayout,
    hasMcp,
    hasSkills,
    secretFound,
  };
}

function capNext(ids) {
  const seen = new Set();
  const out = [];
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_NEXT) break;
  }
  return out;
}

function card(partial) {
  return Object.assign({
    schema: 'dojo.training.invite.v1',
    invited: false,
    practiced: [],
    next: [],
    unlock: 'choice',
    exam_required: true,
    belt_credit: false,
    catalog: false,
    wrote: false,
    recommend_only: true,
  }, partial);
}

function invite(mode, root) {
  if (mode === 'cold') {
    return card({
      invited: false,
      reason: 'Enter the dojo and complete a door first.',
    });
  }
  if (mode === 'door_a') {
    return card({
      invited: true,
      door: 'a',
      practiced: [],
      next: ['101'],
      reason: 'Setup is not knowledge. Next practice is 101.',
    });
  }
  if (mode === 'door_b') {
    if (!root || !existsDir(root)) {
      return card({
        invited: false,
        could_not_verify: 'door_b requires --root <existing folder>',
      });
    }
    const s = scanRoot(root);
    const practiced = [];
    const prefer = [];
    if (s.secretFound) {
      prefer.push('101');
    } else if (s.hasProfile) {
      practiced.push('101');
    }
    if (s.hasWorking) practiced.push('301');
    else prefer.push('301');
    if (!s.hasMcp) prefer.push('201');
    if (!s.hasLayout || s.workingLines > 30) prefer.push('401');
    const next = capNext(prefer);
    return card({
      invited: true,
      door: 'b',
      practiced,
      next,
      reason: 'Files can look practiced. Belts still need the exam.',
      signals: {
        secret_found: s.secretFound,
        has_profile: s.hasProfile,
        has_working: s.hasWorking,
        has_mcp: s.hasMcp,
        has_layout: s.hasLayout,
      },
    });
  }
  return card({
    invited: false,
    could_not_verify: 'mode must be cold, door_a, or door_b',
  });
}

function main() {
  const args = parseArgs(process.argv);
  const root = args.root ? path.resolve(args.root) : null;
  const report = invite(args.mode, root);
  process.stdout.write(`${JSON.stringify(report)}\n`);
  if (report.could_not_verify) process.exit(1);
  process.exit(0);
}

if (require.main === module) main();

module.exports = { invite };
