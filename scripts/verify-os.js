#!/usr/bin/env node
/**
 * Run all TheDojo OS acceptance suites.
 */
const { execFileSync } = require('child_process');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const SUITES = [
  ['enter-the-dojo', 'scripts/enter-the-dojo.js', ['--check']],
  ['operator-profile', 'skills/operator-profile/scripts/run-acceptance.js'],
  ['memory-loop', 'skills/memory-loop/scripts/run-acceptance.js'],
  ['inspect-os', 'skills/inspect-os/scripts/run-acceptance.js'],
  ['connector-map', 'skills/connector-map/scripts/run-acceptance.js'],
  ['superninja', 'skills/superninja/scripts/run-acceptance.js'],
  ['career-loop', 'skills/career-loop/scripts/run-acceptance.js'],
  ['factory-intake', 'skills/factory-intake/scripts/run-acceptance.js'],
  ['dojo-belts', 'skills/dojo-belts/scripts/run-acceptance.js'],
  ['dojo-training', 'skills/dojo-training/scripts/run-acceptance.js'],
  ['os-101', 'skills/os-101/scripts/run-acceptance.js'],
  ['os-201', 'skills/os-201/scripts/run-acceptance.js'],
];

function main() {
  const results = [];
  let allPass = true;
  for (const entry of SUITES) {
    const name = entry[0];
    const rel = entry[1];
    const extra = entry[2] || [];
    let pass = false;
    let detail = '';
    try {
      const stdout = execFileSync(process.execPath, [path.join(REPO, rel), ...extra], {
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
