#!/usr/bin/env node
/**
 * First-visit entry for TheDojo.
 * Prints docs/WELCOME.md from disk so an AI (or a human in a terminal)
 * hears the founder story from a file, not from model memory.
 *
 * Same command on Windows, macOS, and Linux (Node 18+):
 *   node scripts/enter-the-dojo.js
 *   node scripts/enter-the-dojo.js --check
 *
 * Resolves files from this script's folder, so it works no matter
 * what the current working directory is.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WELCOME = path.join(ROOT, 'docs', 'WELCOME.md');

const FOOTER = [
  '',
  '---',
  'Next (wait for the human):',
  '  Start your own dojo  ->  docs/LAUNCH.md',
  '  Why this exists      ->  docs/PURPOSE.md',
  '  Proof it runs        ->  node scripts/verify-os.js',
  '',
  'If you are a human reading this in a terminal without an AI: clone this repo,',
  'open the folder in Cursor (or any model that can read files), and say:',
  '  Enter the dojo.',
  '',
].join('\n');

function fail(msg) {
  process.stderr.write(msg + '\n');
  process.exit(1);
}

function readUtf8(filePath) {
  let buf = fs.readFileSync(filePath);
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    buf = buf.subarray(3);
  }
  return buf.toString('utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function main() {
  const checkOnly = process.argv.slice(2).includes('--check');
  if (!fs.existsSync(WELCOME)) {
    fail('enter-the-dojo: missing docs/WELCOME.md next to this repo root.');
  }
  const text = readUtf8(WELCOME);
  if (!text.includes('Michael Billett Jr.') || !text.includes('Welcome to TheDojo')) {
    fail('enter-the-dojo: WELCOME.md missing founder story (file looks empty or wrong).');
  }
  if (checkOnly) {
    process.stdout.write(JSON.stringify({ pass: true, file: 'docs/WELCOME.md' }) + '\n');
    return;
  }
  process.stdout.write('\n' + text.trim() + '\n' + FOOTER);
}

main();
