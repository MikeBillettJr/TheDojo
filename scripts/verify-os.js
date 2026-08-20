#!/usr/bin/env node
/**
 * Run all TheDojo OS acceptance suites.
 */
const { execFileSync } = require('child_process');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const SUITES = [
  ['operator-profile', 'skills/operator-profile/scripts/run-acceptance.js'],
  ['memory-loop', 'skills/memory-loop/scripts/run-acceptance.js'],
  ['superninja', 'skills/superninja/scripts/run-acceptance.js'],
];

function main() {
  const results = [];
  let allPass = true;
  for (const [name, rel] of SUITES) {
    let pass = false;
    let detail = '';
    try {
      const stdout = execFileSync(process.execPath, [path.join(REPO, rel)], {
        encoding: 'utf8',
        cwd: REPO,
      });
      const parsed = JSON.parse(stdout);
      pass = parsed.pass === true;
      detail = pass ? 'ok' : JSON.stringify(parsed.checks?.filter((c) => !c.pass));
    } catch (e) {
      detail = e.stderr || e.message;
    }
    if (!pass) allPass = false;
    results.push({ suite: name, pass, detail });
  }
  console.log(JSON.stringify({ pass: allPass, results }, null, 2));
  process.exit(allPass ? 0 : 1);
}

main();
