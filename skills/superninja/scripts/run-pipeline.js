#!/usr/bin/env node
/**
 * Unattended superninja pipeline: session + vault + repo + render. No LLM.
 *
 * Usage:
 *   node run-pipeline.js --sessions <dir> --vault <dir> --repo <dir> [--runtime <dir>] [--out-dir <dir>]
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPTS = __dirname;

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

function runNode(script, args) {
  return spawnSync(process.execPath, [path.join(SCRIPTS, script), ...args], {
    encoding: 'utf8',
    cwd: path.resolve(__dirname, '../../..'),
  });
}

function parseJsonStdout(proc) {
  if (!proc.stdout) return null;
  try {
    return JSON.parse(proc.stdout);
  } catch {
    return null;
  }
}

function emit(result, outPath) {
  const text = JSON.stringify(result, null, 2);
  console.log(text);
  if (outPath) {
    fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
    fs.writeFileSync(outPath, text, 'utf8');
  }
}

function main() {
  const started = Date.now();
  const args = parseArgs(process.argv);
  if (!args.sessions || !args.vault || !args.repo) {
    console.error(
      'Usage: node run-pipeline.js --sessions <dir> --vault <dir> --repo <dir> [--runtime <dir>] [--out-dir <dir>]'
    );
    process.exit(2);
  }

  const outDir = args['out-dir']
    ? path.resolve(args['out-dir'])
    : path.resolve(__dirname, '../../../eval/superninja/results/pipeline');
  fs.mkdirSync(outDir, { recursive: true });

  const sessionOut = path.join(outDir, 'session.json');
  const vaultOut = path.join(outDir, 'vault.json');
  const repoOut = path.join(outDir, 'repo.json');
  const cardOut = path.join(outDir, 'card.md');
  const pipelineOut = path.join(outDir, 'pipeline.json');

  const sessionProc = runNode('session-scan.js', [
    '--root',
    path.resolve(args.sessions),
    '--out',
    sessionOut,
  ]);
  const vaultProc = runNode('vault-scan.js', [
    '--vault',
    path.resolve(args.vault),
    '--out',
    vaultOut,
  ]);
  const repoArgs = ['--repo', path.resolve(args.repo), '--out', repoOut];
  if (args.runtime) repoArgs.splice(2, 0, '--runtime', path.resolve(args.runtime));
  const repoProc = runNode('repo-scan.js', repoArgs);

  const session = parseJsonStdout(sessionProc);
  const vault = parseJsonStdout(vaultProc);
  const repo = parseJsonStdout(repoProc);

  const renderProc = runNode('render-ninja-card.js', [
    '--session',
    sessionOut,
    '--vault',
    vaultOut,
    '--repo',
    repoOut,
    '--out',
    cardOut,
  ]);
  const card = renderProc.stdout || '';

  const result = {
    schema: 'thedojo.superninja.pipeline.v1',
    scanned_at: new Date().toISOString(),
    out_dir: outDir,
    duration_ms: Date.now() - started,
    session,
    vault,
    repo,
    card,
    status: /Status: \*\*rejected\*\*/.test(card) ? 'rejected' : 'recommend_only',
    child_exit_codes: {
      session: sessionProc.status,
      vault: vaultProc.status,
      repo: repoProc.status,
      render: renderProc.status,
    },
  };

  emit(result, pipelineOut);

  if (!args['no-history']) {
    const historyPath = args.history
      ? path.resolve(args.history)
      : path.resolve(__dirname, '../../../eval/superninja/history.jsonl');
    runNode('regression-report.js', ['--append', pipelineOut, '--history', historyPath]);
  }
}

main();
