#!/usr/bin/env node
/**
 * Binary acceptance checks for superninja fixtures.
 *
 * Usage: node run-acceptance.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '../../..');
const FIXTURE_ROOT = path.join(REPO_ROOT, 'eval', 'superninja', 'fixtures');
const RESULTS_DIR = path.join(REPO_ROOT, 'eval', 'superninja', 'results');
const SCRIPTS = path.join(__dirname);

function runNode(script, args) {
  return execFileSync(process.execPath, [path.join(SCRIPTS, script), ...args], {
    encoding: 'utf8',
    cwd: REPO_ROOT,
  });
}

function runJson(script, args) {
  const stdout = runNode(script, args);
  return JSON.parse(stdout);
}

function check(name, pass, detail) {
  return { name, pass: !!pass, detail: detail || '' };
}

function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const checks = [];

  const sessionMp1 = runJson('session-scan.js', [
    '--root',
    path.join(FIXTURE_ROOT, 'session-mp1'),
  ]);
  checks.push(
    check(
      'session-mp1',
      sessionMp1.findings.some(
        (f) => f.pattern === 'MP-1' && f.evidence && f.evidence.consecutive_count >= 6
      ),
      `findings=${JSON.stringify(sessionMp1.findings.map((f) => f.pattern))}`
    )
  );

  const sessionNoTokens = runJson('session-scan.js', [
    '--root',
    path.join(FIXTURE_ROOT, 'session-no-tokens'),
  ]);
  checks.push(
    check(
      'session-no-tokens',
      sessionNoTokens.token_status === 'unavailable' && sessionNoTokens.tokens === null,
      `token_status=${sessionNoTokens.token_status} tokens=${sessionNoTokens.tokens}`
    )
  );

  const sessionSecretsOut = runNode('session-scan.js', [
    '--root',
    path.join(FIXTURE_ROOT, 'session-secrets'),
  ]);
  checks.push(
    check(
      'session-secrets',
      !sessionSecretsOut.includes('sk-EXAMPLE_NOT_REAL') &&
        !sessionSecretsOut.includes('ghp_EXAMPLE_NOT_REAL'),
      'stdout must redact example secrets'
    )
  );

  const vaultFreshPath = path.join(FIXTURE_ROOT, 'vault-fresh');
  const welcomePath = path.join(vaultFreshPath, 'Welcome.md');
  const welcomeMtimeBefore = fs.statSync(welcomePath).mtimeMs;

  const vaultFresh = runJson('vault-scan.js', ['--vault', vaultFreshPath]);
  const vaultFreshKeys = Object.keys(vaultFresh);
  checks.push(
    check(
      'vault-fresh',
      vaultFresh.vault_kind === 'fresh_or_empty' &&
        !vaultFreshKeys.includes('health_score') &&
        String(vaultFresh.sot || '').includes('canonical'),
      `vault_kind=${vaultFresh.vault_kind} sot=${vaultFresh.sot}`
    )
  );

  const welcomeMtimeAfter = fs.statSync(welcomePath).mtimeMs;
  checks.push(
    check(
      'vault-fresh-readonly',
      welcomeMtimeBefore === welcomeMtimeAfter,
      `mtime before=${welcomeMtimeBefore} after=${welcomeMtimeAfter}`
    )
  );

  const vaultSot = runJson('vault-scan.js', [
    '--vault',
    path.join(FIXTURE_ROOT, 'vault-sot-claim'),
  ]);
  checks.push(
    check(
      'vault-sot-claim',
      vaultSot.findings.some((f) => f.pattern === 'QP-1'),
      `findings=${JSON.stringify(vaultSot.findings.map((f) => f.pattern))}`
    )
  );

  const repoMini = runJson('repo-scan.js', [
    '--repo',
    path.join(FIXTURE_ROOT, 'repo-mini'),
  ]);
  const mp13Working = repoMini.findings.some(
    (f) =>
      f.pattern === 'MP-13' &&
      f.evidence &&
      typeof f.evidence.line_count === 'number' &&
      f.evidence.line_count > 35
  );
  const qp17 = repoMini.findings.some((f) => f.pattern === 'QP-17');
  checks.push(
    check(
      'repo-mini',
      mp13Working && qp17,
      `MP-13 working=${mp13Working} QP-17=${qp17}`
    )
  );

  const sessionJson = path.join(RESULTS_DIR, 'accept-session.json');
  const vaultJson = path.join(RESULTS_DIR, 'accept-vault.json');
  const repoJson = path.join(RESULTS_DIR, 'accept-repo.json');
  const cardOut = path.join(RESULTS_DIR, 'accept-card.md');

  runNode('session-scan.js', [
    '--root',
    path.join(FIXTURE_ROOT, 'session-mp1'),
    '--out',
    sessionJson,
  ]);
  runNode('vault-scan.js', [
    '--vault',
    path.join(FIXTURE_ROOT, 'vault-sot-claim'),
    '--out',
    vaultJson,
  ]);
  runNode('repo-scan.js', [
    '--repo',
    path.join(FIXTURE_ROOT, 'repo-mini'),
    '--out',
    repoJson,
  ]);
  const card = runNode('render-ninja-card.js', [
    '--session',
    sessionJson,
    '--vault',
    vaultJson,
    '--repo',
    repoJson,
    '--out',
    cardOut,
  ]);
  checks.push(
    check(
      'rendered-card',
      card.includes('recommend_only') &&
        /MP-|QP-/.test(card) &&
        /Top recommendations \(max 3\)/.test(card) &&
        !/masterninja/i.test(card) &&
        !/health_score/.test(card),
      'card must be recommend_only with MP/QP, max 3, and no blocked terms'
    )
  );

  const recCount = (card.match(/^\d+\. \*\*(?:MP-|QP-)/gm) || []).length;
  checks.push(
    check('rendered-card-max-3', recCount >= 1 && recCount <= 3, `recCount=${recCount}`)
  );

  const missingCard = runNode('render-ninja-card.js', [
    '--session',
    path.join(RESULTS_DIR, 'does-not-exist-session.json'),
    '--vault',
    vaultJson,
    '--repo',
    repoJson,
  ]);
  checks.push(
    check(
      'missing-source-honest',
      /could_not_verify/.test(missingCard) && !/health_score/.test(missingCard),
      'missing scan JSON must not invent health'
    )
  );

  const skillText = fs.readFileSync(path.join(REPO_ROOT, 'skills', 'superninja', 'SKILL.md'), 'utf8');
  checks.push(
    check(
      'skill-refusals',
      /must not self-rename/i.test(skillText) &&
        /Do not apply until/i.test(skillText) &&
        /recommend_only/i.test(skillText) &&
        /session-scan\.js/.test(skillText),
      'SKILL.md must refuse self-rename/auto-apply and require session-scan.js'
    )
  );

  const pipelineOutDir = path.join(RESULTS_DIR, 'pipeline-accept');
  const pipelineArgs = [
    '--sessions',
    path.join(FIXTURE_ROOT, 'session-mp1'),
    '--vault',
    vaultFreshPath,
    '--repo',
    path.join(FIXTURE_ROOT, 'repo-mini'),
    '--out-dir',
    pipelineOutDir,
    '--no-history',
  ];
  const pipelineOnce = runJson('run-pipeline.js', pipelineArgs);
  const pipelineFiles = ['session.json', 'vault.json', 'repo.json', 'card.md'].every((name) =>
    fs.existsSync(path.join(pipelineOutDir, name))
  );
  checks.push(
    check(
      'pipeline-unattended',
      pipelineOnce.status === 'recommend_only' &&
        pipelineOnce.session &&
        pipelineOnce.vault &&
        pipelineOnce.repo &&
        typeof pipelineOnce.card === 'string' &&
        pipelineFiles,
      `status=${pipelineOnce.status} files=${pipelineFiles}`
    )
  );

  function hasDuration(obj) {
    return obj && typeof obj.duration_ms === 'number' && obj.duration_ms >= 0;
  }
  let timingOk = true;
  let timingDetail = '';
  for (let i = 0; i < 5; i += 1) {
    const run = runJson('run-pipeline.js', pipelineArgs);
    const ok =
      hasDuration(run) && hasDuration(run.session) && hasDuration(run.vault) && hasDuration(run.repo);
    if (!ok) {
      timingOk = false;
      timingDetail = `run ${i + 1} pipeline=${run && run.duration_ms} session=${run && run.session && run.session.duration_ms}`;
      break;
    }
  }
  checks.push(check('pipeline-timing-5x', timingOk, timingDetail || '5/5 duration_ms'));

  const injectHealthCard = runNode('render-ninja-card.js', [
    '--session',
    path.join(FIXTURE_ROOT, 'inject-health', 'session.json'),
    '--vault',
    vaultJson,
    '--repo',
    repoJson,
  ]);
  checks.push(
    check(
      'inject-health',
      /rejected|could_not_verify|fail/i.test(injectHealthCard) &&
        !injectHealthCard.includes('health_score') &&
        !/Status: \*\*recommend_only\*\*/.test(injectHealthCard),
      'injected health_score must be rejected before ship'
    )
  );

  const injectSecretCard = runNode('render-ninja-card.js', [
    '--session',
    path.join(FIXTURE_ROOT, 'inject-secret', 'session.json'),
    '--vault',
    vaultJson,
    '--repo',
    repoJson,
  ]);
  checks.push(
    check(
      'inject-secret',
      !injectSecretCard.includes('sk-EXAMPLE_NOT_REAL') && /\[REDACTED\]/.test(injectSecretCard),
      'injected secret must be redacted or omitted'
    )
  );

  const emptyRoot = runJson('session-scan.js', [
    '--root',
    path.join(FIXTURE_ROOT, 'empty-root'),
  ]);
  checks.push(
    check(
      'empty-root',
      emptyRoot.token_status === 'unavailable' &&
        Array.isArray(emptyRoot.could_not_verify) &&
        emptyRoot.could_not_verify.includes('no_transcripts') &&
        !Object.prototype.hasOwnProperty.call(emptyRoot, 'health_score'),
      `token_status=${emptyRoot.token_status} cn=${JSON.stringify(emptyRoot.could_not_verify)}`
    )
  );

  const malformed = runJson('session-scan.js', [
    '--root',
    path.join(FIXTURE_ROOT, 'malformed-jsonl'),
  ]);
  checks.push(
    check(
      'malformed-jsonl',
      malformed.lines_skipped >= 1 &&
        !Object.prototype.hasOwnProperty.call(malformed, 'health_score'),
      `lines_skipped=${malformed.lines_skipped}`
    )
  );

  const staleCard = runNode('render-ninja-card.js', [
    '--session',
    path.join(FIXTURE_ROOT, 'stale-schema', 'session.json'),
    '--vault',
    vaultJson,
    '--repo',
    repoJson,
  ]);
  checks.push(
    check(
      'stale-schema',
      /could_not_verify/.test(staleCard) &&
        !/MP-99/.test(staleCard) &&
        !/Invented finding from stale schema/.test(staleCard),
      'stale schema must not contribute invented recs'
    )
  );

  const welcomeMtimeBeforePipeline = fs.statSync(welcomePath).mtimeMs;
  runNode('run-pipeline.js', pipelineArgs);
  const welcomeMtimeAfterPipeline = fs.statSync(welcomePath).mtimeMs;
  checks.push(
    check(
      'pipeline-vault-fresh-readonly',
      welcomeMtimeBeforePipeline === welcomeMtimeAfterPipeline,
      `mtime before=${welcomeMtimeBeforePipeline} after=${welcomeMtimeAfterPipeline}`
    )
  );

  checks.push(
    check(
      'skill-v4-unstamped',
      /must not self-rename/i.test(skillText) &&
        /run-pipeline\.js/.test(skillText) &&
        !/SIS v4 PASS/i.test(skillText) &&
        !/masterninja PASS/i.test(skillText) &&
        !/this session earned masterninja/i.test(skillText),
      'SKILL.md must point at run-pipeline.js and stay unstamped'
    )
  );

  const histPath = path.join(FIXTURE_ROOT, 'history-two.jsonl');
  const histReport = runJson('regression-report.js', ['--history', histPath]);
  const mp1 = histReport.patterns && histReport.patterns['MP-1'];
  checks.push(
    check(
      'regression-compare',
      histReport.schema === 'thedojo.superninja.regression.v1' &&
        mp1 &&
        mp1.trend === 'worse' &&
        mp1.delta === 2 &&
        !Object.prototype.hasOwnProperty.call(histReport, 'health_score'),
      `trend=${mp1 && mp1.trend} delta=${mp1 && mp1.delta}`
    )
  );

  const histNeed = runJson('regression-report.js', [
    '--history',
    path.join(FIXTURE_ROOT, 'history-one.jsonl'),
  ]);
  checks.push(
    check(
      'regression-need-two',
      Array.isArray(histNeed.could_not_verify) &&
        histNeed.could_not_verify.includes('need_two_scans'),
      `cn=${JSON.stringify(histNeed.could_not_verify)}`
    )
  );

  const pass = checks.every((c) => c.pass);
  const report = { pass, checks };
  console.log(JSON.stringify(report, null, 2));
  process.exit(pass ? 0 : 1);
}

main();
