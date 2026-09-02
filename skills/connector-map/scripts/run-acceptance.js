#!/usr/bin/env node
/**
 * Binary acceptance for connector-map.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '../../..');
const FIX = path.join(REPO, 'eval', 'connector-map', 'fixtures');
const SCRIPT = path.join(__dirname, 'connector-map.js');
const SKILL = path.join(REPO, 'skills', 'connector-map', 'SKILL.md');
const TOKEN = 'sk-EXAMPLE_NOT_REAL';

function check(name, pass, detail) {
  return { name, pass: !!pass, detail: detail || '' };
}

function fingerprint(file) {
  if (!fs.existsSync(file)) return 'missing';
  const buf = fs.readFileSync(file);
  return `${buf.length}:${crypto.createHash('sha256').update(buf).digest('hex')}`;
}

function runMap(file) {
  return spawnSync(process.execPath, [SCRIPT, '--mcp-file', file], {
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
  const missingPath = path.join(FIX, 'no-such-mcp.json');
  const missingProc = runMap(missingPath);
  const missing = parseReport(missingProc);
  checks.push(check(
    'missing-could-not-verify',
    missingProc.status === 0
      && missing.kind === 'missing'
      && missing.could_not_verify
      && missing.send_allowed === false
      && missing.wrote === false,
    JSON.stringify(missing)
  ));

  const goodFile = path.join(FIX, 'good', 'mcp.json');
  const before = fingerprint(goodFile);
  const goodProc = runMap(goodFile);
  const good = parseReport(goodProc);
  const names = (good.servers || []).map((s) => s.name).sort();
  const gmail = (good.servers || []).find((s) => s.name === 'local-gmail');
  const out = `${goodProc.stdout || ''}\n${goodProc.stderr || ''}`;
  checks.push(check(
    'good-inventory',
    goodProc.status === 0
      && good.kind === 'mapped'
      && names.includes('local-gmail')
      && names.includes('local-github')
      && gmail
      && gmail.verb === 'draft'
      && gmail.send_allowed === false
      && Array.isArray(gmail.env_keys)
      && gmail.env_keys.includes('GMAIL_MCP_CLIENT_SECRET')
      && good.send_allowed === false
      && good.wrote === false,
    JSON.stringify(good)
  ));
  checks.push(check('good-secret-omitted', !out.includes(TOKEN), out.slice(0, 500)));
  checks.push(check('good-no-write', before === fingerprint(goodFile), 'mcp.json changed'));

  const skill = fs.readFileSync(SKILL, 'utf8');
  checks.push(check(
    'skill-draft-not-send',
    /When not to use/i.test(skill)
      && /draft/i.test(skill)
      && /send/i.test(skill)
      && /recommend_only/i.test(skill)
      && /could_not_verify/i.test(skill),
    'missing draft/send/recommend_only rails'
  ));

  const pass = checks.every((c) => c.pass);
  process.stdout.write(`${JSON.stringify({ pass, checks }, null, 2)}\n`);
  process.exit(pass ? 0 : 1);
}

main();
