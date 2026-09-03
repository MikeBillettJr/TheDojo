#!/usr/bin/env node
/**
 * Read-only OS inspect (Door B). Inventory + gap card. Never writes.
 *
 *   node skills/inspect-os/scripts/inspect-os.js --root <dir>
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { invite } = require('../../dojo-training/scripts/invite-training.js');

const SECRET_RE = /\b(sk-|ghp_|github_pat_|xox[baprs]-|BEGIN [A-Z ]+PRIVATE KEY)\S*/gi;
const IGNORE = new Set(['.git', 'node_modules', '.gitkeep', '.DS_Store']);
const ROOT_FILES = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', '.cursorrules'];
const MEMORY_FILES = [
  'PROFILE.md',
  'WORKING.md',
  'LESSONS.md',
  'agent-interface.md',
  'non-negotiables.md',
];
const TRIO = [
  {
    id: 'operator-profile',
    evidence: ['memory/PROFILE.md', 'skills/operator-profile/SKILL.md'],
  },
  {
    id: 'memory-loop',
    evidence: ['memory/WORKING.md', 'skills/memory-loop/SKILL.md'],
  },
  {
    id: 'superninja',
    evidence: ['skills/superninja/SKILL.md'],
  },
];

function redact(text) {
  return String(text).replace(SECRET_RE, '[REDACTED]');
}

function redactDeep(value) {
  if (typeof value === 'string') return redact(value);
  if (Array.isArray(value)) return value.map(redactDeep);
  if (value && typeof value === 'object') {
    const next = {};
    for (const [k, v] of Object.entries(value)) next[k] = redactDeep(v);
    return next;
  }
  return value;
}

function parseArgs(argv) {
  let root = null;
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--root') root = argv[++i];
  }
  return { root };
}

function existsFile(abs) {
  try {
    return fs.statSync(abs).isFile();
  } catch (e) {
    return false;
  }
}

function existsDir(abs) {
  try {
    return fs.statSync(abs).isDirectory();
  } catch (e) {
    return false;
  }
}

function listSkillNames(skillsDir) {
  if (!existsDir(skillsDir)) return [];
  return fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !IGNORE.has(entry.name) && entry.name !== '_template')
    .filter((entry) => existsFile(path.join(skillsDir, entry.name, 'SKILL.md')))
    .map((entry) => entry.name)
    .sort();
}

function listCursorRules(rulesDir) {
  if (!existsDir(rulesDir)) return [];
  return fs.readdirSync(rulesDir)
    .filter((name) => name.toLowerCase().endsWith('.mdc') && !IGNORE.has(name))
    .sort();
}

function inspect(root) {
  const foundRoot = {};
  for (const name of ROOT_FILES) {
    foundRoot[name] = existsFile(path.join(root, name));
  }
  const foundMemory = {};
  for (const name of MEMORY_FILES) {
    foundMemory[name] = existsFile(path.join(root, 'memory', name));
  }
  const skillNames = listSkillNames(path.join(root, 'skills'));
  const cursorRules = listCursorRules(path.join(root, '.cursor', 'rules'));

  const hasProfile = foundMemory['PROFILE.md'] === true;
  const hasWorking = foundMemory['WORKING.md'] === true;
  const kind = (Object.values(foundRoot).some(Boolean)
    || hasProfile
    || hasWorking
    || skillNames.length > 0
    || cursorRules.length > 0)
    ? 'existing'
    : 'blank_slate';

  const gaps = [];
  const mergePlan = [];
  for (const item of TRIO) {
    const present = item.evidence.some((rel) => existsFile(path.join(root, rel)));
    if (!present) {
      gaps.push(item.id);
      mergePlan.push({
        add: item.id,
        action: `Add ${item.id} without overwriting existing files. recommend_only until the operator names the write.`,
      });
    }
  }

  if (kind === 'blank_slate') {
    mergePlan.length = 0;
    mergePlan.push({
      add: 'door_a',
      action: 'Blank tree. Use docs/LAUNCH.md and operator-profile. Do not run the identity interview under inspect-os.',
    });
  }

  const trainingInvite = kind === 'blank_slate'
    ? invite('cold')
    : invite('door_b', root);

  return {
    kind,
    recommend: kind === 'blank_slate' ? 'door_a' : 'door_b',
    found: {
      root_files: foundRoot,
      memory: foundMemory,
      skills: skillNames,
      cursor_rules: cursorRules,
    },
    gaps,
    merge_plan: mergePlan,
    training_invite: trainingInvite,
    wrote: false,
    recommend_only: true,
  };
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.root) {
    process.stderr.write('inspect-os: --root <dir> is required.\n');
    process.stdout.write(`${JSON.stringify({ pass: false, error: 'missing --root' })}\n`);
    process.exit(1);
  }
  const root = path.resolve(args.root);
  if (!existsDir(root)) {
    process.stderr.write(`inspect-os: not a directory: ${root}\n`);
    process.stdout.write(`${JSON.stringify({ pass: false, error: 'root not found', root: redact(root) })}\n`);
    process.exit(1);
  }
  const report = redactDeep(inspect(root));
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(0);
}

if (require.main === module) main();

module.exports = { inspect, redact, redactDeep };
