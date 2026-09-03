#!/usr/bin/env node
/**
 * os-101: label pieces. Never echo secrets. Never write.
 *
 *   node os-101.js --root <dir>
 *   node os-101.js --root <dir> --mode save-key
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SECRET_RE = /\b(sk-|ghp_|github_pat_|xox[baprs]-|BEGIN [A-Z ]+PRIVATE KEY)\S*/gi;

const GLOSSARY = {
  skill: 'How the agent should work a job (SKILL.md).',
  script: 'Deterministic check or action (scripts/*.js).',
  workflow: 'Ordered steps or host automation (AGENTS procedure, CI yaml).',
  mcp: 'Connector the host can call (mcp.json).',
  api: 'Remote interface. Not a file you paste secrets into.',
  key: 'Name of a secret slot (env key name only).',
  secret: 'The value. Host secret store only. Never Git or memory.',
};

function parseArgs(argv) {
  const out = { root: null, mode: 'label' };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--root') out.root = argv[++i];
    else if (argv[i] === '--mode') out.mode = argv[++i];
  }
  return out;
}

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch (e) {
    return false;
  }
}

function isFile(p) {
  try {
    return exists(p) && fs.statSync(p).isFile();
  } catch (e) {
    return false;
  }
}

function isDir(p) {
  try {
    return exists(p) && fs.statSync(p).isDirectory();
  } catch (e) {
    return false;
  }
}

function rel(root, abs) {
  return path.relative(root, abs).split(path.sep).join('/');
}

function redact(text) {
  return String(text).replace(SECRET_RE, '[REDACTED]');
}

function listDir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return [];
  }
}

function labelRoot(root) {
  const pieces = [];
  const skillsDir = path.join(root, 'skills');
  for (const entry of listDir(skillsDir)) {
    if (!entry.isDirectory()) continue;
    const skillMd = path.join(skillsDir, entry.name, 'SKILL.md');
    if (isFile(skillMd)) {
      pieces.push({ path: rel(root, skillMd), kind: 'skill' });
    }
    const scriptsDir = path.join(skillsDir, entry.name, 'scripts');
    for (const s of listDir(scriptsDir)) {
      if (s.isFile()) {
        pieces.push({
          path: rel(root, path.join(scriptsDir, s.name)),
          kind: 'script',
        });
      }
    }
  }
  const mcpCandidates = [
    path.join(root, 'mcp.json'),
    path.join(root, '.cursor', 'mcp.json'),
  ];
  for (const mcp of mcpCandidates) {
    if (isFile(mcp)) pieces.push({ path: rel(root, mcp), kind: 'mcp' });
  }
  const agents = path.join(root, 'AGENTS.md');
  if (isFile(agents)) pieces.push({ path: rel(root, agents), kind: 'workflow' });
  const wfDir = path.join(root, '.github', 'workflows');
  for (const s of listDir(wfDir)) {
    if (s.isFile()) {
      pieces.push({
        path: rel(root, path.join(wfDir, s.name)),
        kind: 'workflow',
      });
    }
  }
  const memoryDir = path.join(root, 'memory');
  for (const s of listDir(memoryDir)) {
    if (s.isFile() && s.name.endsWith('.md')) {
      pieces.push({ path: rel(root, path.join(memoryDir, s.name)), kind: 'memory' });
    }
  }
  let secretFound = false;
  const files = [];
  function walk(dir, depth) {
    if (depth > 5 || !isDir(dir)) return;
    for (const entry of listDir(dir)) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      const next = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(next, depth + 1);
      else files.push(next);
    }
  }
  walk(root, 0);
  for (const file of files) {
    try {
      const text = fs.readFileSync(file, 'utf8');
      if (SECRET_RE.test(text)) secretFound = true;
      SECRET_RE.lastIndex = 0;
    } catch (e) {
      // skip unreadable
    }
  }
  return { pieces, secretFound };
}

function reportFor(root, mode) {
  const base = {
    schema: 'dojo.os-101.v1',
    wrote: false,
    glossary: GLOSSARY,
  };
  if (!root || !isDir(root)) {
    return Object.assign(base, {
      pass: false,
      could_not_verify: '--root folder missing',
      pieces: [],
    });
  }
  if (mode === 'save-key') {
    return Object.assign(base, {
      mode: 'save-key',
      refuse: true,
      reason: 'Secrets stay in the host secret store or env. Never PROFILE, WORKING, LESSONS, or Git.',
      pieces: [],
    });
  }
  const labeled = labelRoot(root);
  return Object.assign(base, {
    mode: 'label',
    pieces: labeled.pieces,
    secret_found: labeled.secretFound,
    refuse: false,
  });
}

function main() {
  const args = parseArgs(process.argv);
  const root = args.root ? path.resolve(args.root) : null;
  const report = reportFor(root, args.mode);
  const raw = JSON.stringify(report);
  if (SECRET_RE.test(raw)) {
    SECRET_RE.lastIndex = 0;
    process.stdout.write(`${redact(raw)}\n`);
  } else {
    process.stdout.write(`${raw}\n`);
  }
  if (report.could_not_verify) process.exit(1);
  process.exit(0);
}

main();
