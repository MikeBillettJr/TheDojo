#!/usr/bin/env node
/**
 * Lint memory-loop files (WORKING cap, LESSONS shape).
 *
 * Usage: node lint-memory.js --dir <memory-dir> [--max-lines N]
 */
const fs = require('fs');
const path = require('path');

const SECRET_RE = /\b(sk-|ghp_|github_pat_|xox[baprs]-|BEGIN [A-Z ]+PRIVATE KEY)\S*/i;
const LESSON_DATE_RE = /^##\s+\d{4}-\d{2}-\d{2}\s*$/m;

function parseArgs(argv) {
  const out = { 'max-lines': 35 };
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

function countLines(text) {
  if (!text) return 0;
  if (text.length === 0) return 0;
  return text.split(/\r?\n/).length;
}

function main() {
  const args = parseArgs(process.argv);
  const dir = path.resolve(args.dir || 'memory');
  const maxLines = Number(args['max-lines']) || 35;
  const errors = [];

  const workingPath = path.join(dir, 'WORKING.md');
  if (!fs.existsSync(workingPath)) {
    errors.push('WORKING.md: missing');
  } else {
    const body = fs.readFileSync(workingPath, 'utf8');
    const lines = countLines(body);
    if (SECRET_RE.test(body)) errors.push('WORKING.md: secret pattern detected');
    if (!/^##\s+Focus\s*$/m.test(body)) errors.push('WORKING.md: missing ## Focus');
    if (lines > maxLines) errors.push(`WORKING.md: ${lines} lines exceeds cap ${maxLines}`);
  }

  const lessonsPath = path.join(dir, 'LESSONS.md');
  if (fs.existsSync(lessonsPath)) {
    const body = fs.readFileSync(lessonsPath, 'utf8');
    if (SECRET_RE.test(body)) errors.push('LESSONS.md: secret pattern detected');
    const trimmed = body.replace(/^# Lessons\s*$/m, '').trim();
    if (trimmed && !LESSON_DATE_RE.test(body)) {
      errors.push('LESSONS.md: entries must use ## YYYY-MM-DD headings');
    }
  }

  const result = {
    schema: 'thedojo.memory-loop.lint.v1',
    dir,
    working_line_cap: maxLines,
    pass: errors.length === 0,
    errors,
  };
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.pass ? 0 : 1);
}

main();
