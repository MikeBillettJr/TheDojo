#!/usr/bin/env node
/**
 * Lint operator-profile memory files.
 *
 * Usage: node lint-profile.js --dir <memory-dir>
 */
const fs = require('fs');
const path = require('path');

const SECRET_RE = /\b(sk-|ghp_|github_pat_|xox[baprs]-|BEGIN [A-Z ]+PRIVATE KEY)\S*/i;
const PLACEHOLDER_ONLY = /^\{[A-Z0-9_]+\}$/;

const FILES = {
  'PROFILE.md': [/^##\s+Role\s*$/m, /^##\s+Goals\s*$/m, /^##\s+Preferences\s*$/m],
  'agent-interface.md': [/^##\s+Tone\s*$/m, /^##\s+Pace\s*$/m],
  'non-negotiables.md': [/^##\s+Hard lines\s*$/m],
};

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) out[key] = true;
    else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

function lintFile(rel, body, headingRules) {
  const errors = [];
  if (!body || !body.trim()) {
    errors.push(`${rel}: empty file`);
    return errors;
  }
  if (SECRET_RE.test(body)) {
    errors.push(`${rel}: secret pattern detected`);
  }
  for (const re of headingRules) {
    if (!re.test(body)) errors.push(`${rel}: missing required section (${re})`);
  }
  const placeholders = body.match(/\{[A-Z0-9_]+\}/g) || [];
  const uniq = [...new Set(placeholders)];
  if (uniq.length >= 5) {
    errors.push(`${rel}: too many unfilled placeholders (${uniq.length})`);
  }
  return errors;
}

function main() {
  const args = parseArgs(process.argv);
  const dir = path.resolve(args.dir || 'memory');
  const errors = [];
  const checked = [];

  for (const [rel, rules] of Object.entries(FILES)) {
    const full = path.join(dir, rel);
    if (!fs.existsSync(full)) {
      errors.push(`${rel}: missing`);
      continue;
    }
    checked.push(rel);
    const body = fs.readFileSync(full, 'utf8');
    errors.push(...lintFile(rel, body, rules));
  }

  const result = {
    schema: 'thedojo.operator-profile.lint.v1',
    dir,
    checked,
    pass: errors.length === 0,
    errors,
  };
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.pass ? 0 : 1);
}

main();
