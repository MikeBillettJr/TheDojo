#!/usr/bin/env node
/**
 * Merge session/vault/repo scan JSON into a recommend-only Ninja card.
 *
 * Usage: node render-ninja-card.js --session <json> --vault <json> --repo <json> [--out file]
 */
const fs = require('fs');
const path = require('path');

const SECRET_RE = /\b(sk-|ghp_|github_pat_|xox[baprs]-|BEGIN [A-Z ]+PRIVATE KEY)\S*/gi;

const SCHEMAS = {
  session: 'thedojo.superninja.session-scan.v1',
  vault: 'thedojo.superninja.vault-scan.v1',
  repo: 'thedojo.superninja.repo-scan.v1',
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

function redact(text) {
  return String(text).replace(SECRET_RE, '[REDACTED]');
}

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return { ok: true, data: JSON.parse(raw) };
  } catch {
    return { ok: false, data: null };
  }
}

function hasHealthScore(value) {
  if (!value || typeof value !== 'object') return false;
  if (Object.prototype.hasOwnProperty.call(value, 'health_score')) return true;
  if (Array.isArray(value)) return value.some(hasHealthScore);
  return Object.values(value).some(hasHealthScore);
}

function schemaOk(data, expected) {
  return !!(data && data.schema === expected);
}

function usableScan(read, expected) {
  if (!read.ok || !read.data) return null;
  if (!schemaOk(read.data, expected)) return null;
  if (hasHealthScore(read.data)) return null;
  return read.data;
}

function severityRank(severity) {
  return severity === 'warn' ? 2 : 1;
}

function evidenceScore(finding) {
  const e = finding.evidence || {};
  if (typeof e.consecutive_count === 'number') return e.consecutive_count;
  if (typeof e.line_count === 'number') return e.line_count;
  if (typeof e.count === 'number') return e.count;
  if (Array.isArray(e.skills_missing_eval)) return e.skills_missing_eval.length;
  if (Array.isArray(e.files_differ)) return e.files_differ.length;
  return 0;
}

function formatEvidence(finding) {
  const e = finding.evidence || {};
  if (e.file && e.consecutive_count) return `${e.file} — ${e.tool} × ${e.consecutive_count}`;
  if (e.file && e.line_count) return `${e.file} — ${e.line_count} lines (cap ${e.cap || 30})`;
  if (e.file) return String(e.file);
  if (e.skills_missing_eval) return e.skills_missing_eval.join(', ');
  if (e.only_in_md || e.only_in_jsonl) {
    return `md-only: ${(e.only_in_md || []).join(', ') || 'none'}; jsonl-only: ${(e.only_in_jsonl || []).join(', ') || 'none'}`;
  }
  return JSON.stringify(e);
}

function riskLine(id) {
  const risks = {
    'MP-1': 'Burns latency and spend on work a script could batch.',
    'MP-3': 'Rediscovery delays action on known paths.',
    'MP-4': 'Pull-everything scans inflate context and cost.',
    'MP-5': 'Serial subagents stretch wall clock unnecessarily.',
    'MP-9': 'Parallel skill homes drift from production.',
    'MP-13': 'Shipped work may miss acceptance evidence.',
    'MP-15': 'Subagent chatter loops instead of finishing.',
    'QP-1': 'Wrong-tier source can drive bad decisions.',
    'QP-6': 'Empty or missing sources are not proof of health.',
    'QP-11': 'Docs and runtime skills can silently diverge.',
    'QP-16': 'Open loops vanish when chat compacts.',
    'QP-17': 'Duplicate eval paths guarantee drift.',
  };
  return risks[id] || 'Unverified optimization risk until addressed.';
}

function rankFindings(findings) {
  return [...findings].sort((a, b) => {
    const sev = severityRank(b.severity) - severityRank(a.severity);
    if (sev !== 0) return sev;
    return evidenceScore(b) - evidenceScore(a);
  });
}

function hardMatchLabel(repo) {
  if (!repo || !repo.hard_ids_md || !repo.hard_ids_jsonl) return 'could_not_verify';
  const md = new Set(repo.hard_ids_md);
  const jl = new Set(repo.hard_ids_jsonl);
  for (const id of md) if (!jl.has(id)) return 'mismatch';
  for (const id of jl) if (!md.has(id)) return 'mismatch';
  return 'match';
}

function buildRejectCard(couldNotVerify) {
  const cn = couldNotVerify.length ? couldNotVerify.join(', ') : 'injected_metric';
  return `# Ninja card
Status: **rejected** — scan JSON failed ship gates.
SoT: Git repository (canonical). Vault: navigation-only (read-only scan). Runtime: ~/.cursor (not canonical).

could_not_verify: ${cn}

## Apply
Nothing is applied until the operator approves a **named** change (file + action).
`;
}

function buildCard(session, vault, repo, couldNotVerify) {
  const allFindings = rankFindings([
    ...(session?.findings || []),
    ...(vault?.findings || []),
    ...(repo?.findings || []),
  ]);
  const top = allFindings.slice(0, 3);
  const deferred = Math.max(0, allFindings.length - top.length);

  const tokenStatus = session?.token_status || 'unavailable';
  const tokensLabel = tokenStatus === 'unavailable' ? 'could_not_verify' : 'null';

  const workingLines =
    repo && typeof repo.working_line_count === 'number'
      ? String(repo.working_line_count)
      : 'could_not_verify';

  const cn = couldNotVerify.length ? couldNotVerify.join(', ') : 'none';
  const scannedAt = session?.scanned_at || vault?.scanned_at || repo?.scanned_at || new Date().toISOString();

  const recLines = top.map((f, idx) => {
    const ev = formatEvidence(f);
    return `${idx + 1}. **${f.pattern}** — ${f.recommendation}
   Evidence: ${ev}
   Do: ${f.recommendation}
   Risk: ${riskLine(f.pattern)}`;
  });
  if (recLines.length === 0) {
    recLines.push('1. **none** — No MP/QP findings in merged scans.');
  }

  const card = `# Ninja card
Status: **recommend_only** — no changes applied.
SoT: Git repository (canonical). Vault: navigation-only (read-only scan). Runtime: ~/.cursor (not canonical).

Scanned at: ${scannedAt}
- Sessions: ${session?.files_scanned ?? 'could_not_verify'} jsonl; token_status: ${tokenStatus}; tokens: ${tokensLabel}
- Vault: ${vault?.vault_kind ?? 'could_not_verify'}; markdown notes: ${vault?.markdown_notes ?? 'could_not_verify'}
- Repo: WORKING lines ${workingLines}; HARD md vs jsonl: ${hardMatchLabel(repo)}

could_not_verify: ${cn}

## Top recommendations (max 3)
${recLines.join('\n')}

Deferred findings: ${deferred} (not shown)

## Apply
Nothing is applied until the operator approves a **named** change (file + action).
`;

  return redact(card);
}

function emit(markdown, outPath) {
  console.log(markdown);
  if (outPath) {
    fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
    fs.writeFileSync(outPath, markdown, 'utf8');
  }
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.session || !args.vault || !args.repo) {
    console.error(
      'Usage: node render-ninja-card.js --session <json> --vault <json> --repo <json> [--out file]'
    );
    process.exit(2);
  }

  const couldNotVerify = [];
  const sessionRead = readJson(path.resolve(args.session));
  const vaultRead = readJson(path.resolve(args.vault));
  const repoRead = readJson(path.resolve(args.repo));

  if (!sessionRead.ok) couldNotVerify.push('session_json_unreadable');
  if (!vaultRead.ok) couldNotVerify.push('vault_json_unreadable');
  if (!repoRead.ok) couldNotVerify.push('repo_json_unreadable');

  const poisoned =
    hasHealthScore(sessionRead.data) ||
    hasHealthScore(vaultRead.data) ||
    hasHealthScore(repoRead.data);
  if (poisoned) couldNotVerify.push('injected_metric');

  if (sessionRead.ok && sessionRead.data && !schemaOk(sessionRead.data, SCHEMAS.session)) {
    couldNotVerify.push('session_schema_stale');
  }
  if (vaultRead.ok && vaultRead.data && !schemaOk(vaultRead.data, SCHEMAS.vault)) {
    couldNotVerify.push('vault_schema_stale');
  }
  if (repoRead.ok && repoRead.data && !schemaOk(repoRead.data, SCHEMAS.repo)) {
    couldNotVerify.push('repo_schema_stale');
  }

  let card;
  if (poisoned) {
    card = redact(buildRejectCard(couldNotVerify));
  } else {
    const session = usableScan(sessionRead, SCHEMAS.session);
    const vault = usableScan(vaultRead, SCHEMAS.vault);
    const repo = usableScan(repoRead, SCHEMAS.repo);
    card = buildCard(session, vault, repo, couldNotVerify);
  }
  card = `${card.trimEnd()}\n`;
  emit(card, args.out ? path.resolve(args.out) : null);
}

main();
