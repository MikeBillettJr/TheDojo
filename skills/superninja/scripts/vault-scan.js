#!/usr/bin/env node
/**
 * Read-only Obsidian vault scan. Never writes vault files.
 *
 * Usage: node vault-scan.js --vault <dir> [--out file]
 */
const fs = require('fs');
const path = require('path');

const SOT_CLAIM_RE = /\b(source of truth|canonical SoT|this vault is canonical)\b/i;
const FRESH_WELCOME_SNIPPET = 'This is your new *vault*';

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

function makeFinding(id, severity, evidence, recommendation) {
  return {
    id,
    pattern: id,
    severity,
    evidence,
    recommendation,
    status: 'recommend_only',
  };
}

function collectMarkdown(vaultRoot) {
  const files = [];
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name === '.obsidian') continue;
        walk(path.join(dir, entry.name));
        continue;
      }
      if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(path.join(dir, entry.name));
      }
    }
  }
  walk(vaultRoot);
  return files;
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
  if (!args.vault) {
    console.error('Usage: node vault-scan.js --vault <dir> [--out file]');
    process.exit(2);
  }
  const vault = path.resolve(args.vault);
  if (!fs.existsSync(vault)) {
    console.error(`Vault not found: ${vault}`);
    const unreadable = {
      schema: 'thedojo.superninja.vault-scan.v1',
      vault,
      scanned_at: new Date().toISOString(),
      sot: 'Git repository (canonical)',
      vault_role: 'navigation_only',
      vault_kind: 'unreadable',
      markdown_notes: 0,
      findings: [],
      could_not_verify: ['vault_unreadable'],
      status: 'recommend_only',
      duration_ms: Date.now() - started,
    };
    emit(unreadable, args.out ? path.resolve(args.out) : null);
    process.exit(2);
  }

  const mdFiles = collectMarkdown(vault);
  const findings = [];
  let freshWelcomeOnly = false;

  if (mdFiles.length === 1) {
    const only = mdFiles[0];
    const rel = path.relative(vault, only).split(path.sep).join('/');
    if (rel === 'Welcome.md') {
      let body = '';
      try {
        body = fs.readFileSync(only, 'utf8');
      } catch {
        body = '';
      }
      if (body.includes(FRESH_WELCOME_SNIPPET)) freshWelcomeOnly = true;
    }
  }

  for (const filePath of mdFiles) {
    let body = '';
    try {
      body = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }
    if (SOT_CLAIM_RE.test(body)) {
      findings.push(
        makeFinding(
          'QP-1',
          'warn',
          { file: path.relative(vault, filePath).split(path.sep).join('/') },
          'Treat Git repository (canonical) as SoT; keep the vault navigation-only.'
        )
      );
    }
  }

  let vaultKind = 'populated';
  if (freshWelcomeOnly) vaultKind = 'fresh_or_empty';
  else if (mdFiles.length === 0) vaultKind = 'fresh_or_empty';

  const result = {
    schema: 'thedojo.superninja.vault-scan.v1',
    vault,
    scanned_at: new Date().toISOString(),
    sot: 'Git repository (canonical)',
    vault_role: 'navigation_only',
    vault_kind: vaultKind,
    markdown_notes: mdFiles.length,
    findings,
    could_not_verify: [],
    status: 'recommend_only',
    duration_ms: Date.now() - started,
  };

  emit(result, args.out ? path.resolve(args.out) : null);
}

main();
