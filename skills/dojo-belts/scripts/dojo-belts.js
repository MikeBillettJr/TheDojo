#!/usr/bin/env node
/**
 * Map verify-os (or a saved suite JSON) to consecutive belts. No scores.
 *
 *   node dojo-belts.js --from-json <verify-os.json>
 *   node dojo-belts.js --root <osRoot>
 *
 * Never writes skills/ or memory/. Refuses --write / --apply / --live.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPT_REPO = path.resolve(__dirname, '../../..');
const FORBIDDEN_FLAGS = new Set(['--write', '--apply', '--in-place', '--live', '--overwrite']);

const BELT_ORDER = [
  { id: 'white', require: ['enter-the-dojo'] },
  { id: 'yellow', require: ['enter-the-dojo', 'operator-profile'] },
  { id: 'green', require: ['enter-the-dojo', 'operator-profile', 'memory-loop'] },
  { id: 'brown', require: ['enter-the-dojo', 'operator-profile', 'memory-loop', 'superninja'] },
  { id: 'black', require: 'ALL' },
];

function die(message, code = 1) {
  const report = {
    schema: 'dojo-belts.v1',
    pass: false,
    abort: true,
    wrote: false,
    error: message,
  };
  process.stderr.write(`${message}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(code);
}

function parseArgs(argv) {
  for (const a of argv.slice(2)) {
    if (FORBIDDEN_FLAGS.has(a)) {
      die(`dojo-belts abort: ${a} would write. Belts are read-only.`);
    }
  }
  const out = { fromJson: null, root: SCRIPT_REPO, noWrite: false };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--from-json') out.fromJson = argv[++i];
    else if (argv[i] === '--root') out.root = path.resolve(argv[++i]);
    else if (argv[i] === '--no-write') out.noWrite = true;
  }
  return out;
}

function loadFromJson(file) {
  if (!fs.existsSync(file)) return { missing: true };
  try {
    return { doc: JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch (e) {
    return { missing: true, parse_error: e.message };
  }
}

function runVerify(root) {
  const script = path.join(root, 'scripts', 'verify-os.js');
  if (!fs.existsSync(script)) return { missing: true };
  const proc = spawnSync(process.execPath, [script], {
    encoding: 'utf8',
    cwd: root,
  });
  const text = `${proc.stdout || ''}`.trim();
  if (!text) return { missing: true, parse_error: proc.stderr || 'no stdout' };
  try {
    return { doc: JSON.parse(text) };
  } catch (e) {
    return { missing: true, parse_error: e.message };
  }
}

function kataMap(doc) {
  const map = {};
  const rows = Array.isArray(doc && doc.results) ? doc.results : [];
  for (const row of rows) {
    if (row && row.suite) map[row.suite] = row.pass === true;
  }
  return map;
}

function kataPass(map, id) {
  return map[id] === true;
}

function evaluate(doc) {
  const map = kataMap(doc);
  const suiteIds = Array.isArray(doc.results)
    ? doc.results.map((r) => r && r.suite).filter(Boolean)
    : Object.keys(map);
  const katas = suiteIds.map((id) => ({ id, pass: kataPass(map, id) }));
  const allPass = katas.length > 0 && katas.every((k) => k.pass) && doc.pass === true;

  const earned = [];
  for (const belt of BELT_ORDER) {
    let ok = false;
    if (belt.require === 'ALL') ok = allPass;
    else ok = belt.require.every((id) => kataPass(map, id));
    if (!ok) break;
    earned.push(belt.id);
  }

  const belt = earned.length ? earned[earned.length - 1] : 'none';
  const nextId = BELT_ORDER.find((b) => !earned.includes(b.id));
  return {
    schema: 'dojo-belts.v1',
    verb: 'dojo-belts',
    kind: 'mapped',
    belt,
    earned,
    next: nextId ? nextId.id : null,
    katas,
    wrote: false,
    send_allowed: false,
    recommend_only: true,
    could_not_verify: false,
  };
}

function stripForbidden(report) {
  const banned = ['score', 'health', 'health_score', 'iq', 'ai_iq', 'percent', 'grade', 'token_count'];
  const out = {};
  for (const [k, v] of Object.entries(report)) {
    if (banned.includes(k)) continue;
    out[k] = v;
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv);
  let loaded;
  if (args.fromJson) loaded = loadFromJson(path.resolve(args.fromJson));
  else loaded = runVerify(args.root);

  if (loaded.missing) {
    const report = stripForbidden({
      schema: 'dojo-belts.v1',
      verb: 'dojo-belts',
      kind: 'missing',
      belt: 'none',
      earned: [],
      next: 'white',
      katas: [],
      wrote: false,
      send_allowed: false,
      recommend_only: true,
      could_not_verify: true,
      notes: loaded.parse_error || 'No verify-os JSON. Pass --from-json or run from a repo that has scripts/verify-os.js.',
    });
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exit(0);
  }

  const report = stripForbidden(evaluate(loaded.doc));
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(0);
}

main();
