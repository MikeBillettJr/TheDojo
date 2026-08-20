#!/usr/bin/env node
/**
 * Read-only repo scan for MP/QP patterns.
 *
 * Usage: node repo-scan.js --repo <dir> [--runtime <dir>] [--out file]
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SECRET_RE = /\b(sk-|ghp_|github_pat_|xox[baprs]-|BEGIN [A-Z ]+PRIVATE KEY)\S*/i;
const VAULT_SOT_RE =
  /\b(?:this\s+)?(?:vault|obsidian(?:\s+vault)?)\s+is\s+(?:the\s+)?(?:canonical(?:\s+SoT)?|source of truth)\b|\bthis vault is canonical\b/i;
const HARD_ID_RE = /hard-\d+/g;

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

function fileExists(root, rel) {
  return fs.existsSync(path.join(root, rel));
}

function readText(root, rel) {
  try {
    return fs.readFileSync(path.join(root, rel), 'utf8');
  } catch {
    return null;
  }
}

function countLines(root, rel) {
  const text = readText(root, rel);
  if (text === null) return null;
  if (text.length === 0) return 0;
  return text.split(/\r?\n/).length;
}

function extractHardIdsFromMd(text) {
  const ids = new Set();
  if (!text) return ids;
  for (const match of text.matchAll(HARD_ID_RE)) ids.add(match[0]);
  return ids;
}

function extractHardIdsFromJsonl(root, rel) {
  const ids = new Set();
  const text = readText(root, rel);
  if (!text) return ids;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (row.id && /^hard-\d+$/.test(row.id)) ids.add(row.id);
    } catch {
      /* skip malformed */
    }
  }
  return ids;
}

function listSkillFolders(repoRoot) {
  const skillsDir = path.join(repoRoot, 'skills');
  if (!fs.existsSync(skillsDir)) return [];
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function findSkillMdOutsideSkills(repoRoot) {
  const hits = [];
  const skipDirs = new Set(['node_modules', '.git', 'eval', 'templates']);
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(repoRoot, full).split(path.sep).join('/');
      if (entry.isDirectory()) {
        if (skipDirs.has(entry.name)) continue;
        walk(full);
        continue;
      }
      if (entry.name !== 'SKILL.md') continue;
      if (rel.startsWith('skills' + path.sep) || rel.startsWith('skills/')) continue;
      hits.push(rel);
    }
  }
  walk(repoRoot);
  return hits;
}

function hashFile(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buf).digest('hex');
  } catch {
    return null;
  }
}

function compareRuntimeSkills(repoRoot, runtimeRoot) {
  const diffs = [];
  const repoSkills = path.join(repoRoot, 'skills');
  const runtimeSkills = path.join(runtimeRoot, 'skills');
  if (!fs.existsSync(repoSkills) || !fs.existsSync(runtimeSkills)) return diffs;
  for (const folder of listSkillFolders(repoRoot)) {
    const repoSkill = path.join(repoSkills, folder, 'SKILL.md');
    const runtimeSkill = path.join(runtimeSkills, folder, 'SKILL.md');
    if (!fs.existsSync(repoSkill) || !fs.existsSync(runtimeSkill)) continue;
    const repoHash = hashFile(repoSkill);
    const runtimeHash = hashFile(runtimeSkill);
    if (repoHash && runtimeHash && repoHash !== runtimeHash) {
      diffs.push(`skills/${folder}/SKILL.md`);
    }
  }
  return diffs;
}

function scanMemorySecrets(repoRoot) {
  const hits = [];
  const memoryRoot = path.join(repoRoot, 'memory');
  if (!fs.existsSync(memoryRoot)) return hits;
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.name.endsWith('.md')) continue;
      let body = '';
      try {
        body = fs.readFileSync(full, 'utf8');
      } catch {
        continue;
      }
      const re = new RegExp(SECRET_RE.source, 'gi');
      let match;
      let hit = false;
      while ((match = re.exec(body))) {
        if (/EXAMPLE_NOT_REAL/i.test(match[0])) continue;
        hit = true;
        break;
      }
      if (hit) hits.push(path.relative(repoRoot, full).split(path.sep).join('/'));
    }
  }
  walk(memoryRoot);
  return hits;
}

function scanSkillsVaultClaims(repoRoot) {
  const hits = [];
  const skillsRoot = path.join(repoRoot, 'skills');
  if (!fs.existsSync(skillsRoot)) return hits;
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.name.endsWith('.md')) continue;
      const rel = path.relative(repoRoot, full).split(path.sep).join('/');
      if (rel.endsWith('references/scan-contracts.md')) continue;
      let body = '';
      try {
        body = fs.readFileSync(full, 'utf8');
      } catch {
        continue;
      }
      if (VAULT_SOT_RE.test(body)) {
        hits.push(rel);
      }
    }
  }
  walk(skillsRoot);
  return hits;
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
  if (!args.repo) {
    console.error('Usage: node repo-scan.js --repo <dir> [--runtime <dir>] [--out file]');
    process.exit(2);
  }
  const repo = path.resolve(args.repo);
  const runtime = args.runtime ? path.resolve(args.runtime) : null;
  if (!fs.existsSync(repo)) {
    console.error(`Repo not found: ${repo}`);
    emit(
      {
        schema: 'thedojo.superninja.repo-scan.v1',
        repo,
        runtime,
        scanned_at: new Date().toISOString(),
        sot: 'Git repository (canonical)',
        working_line_count: null,
        hard_ids_md: [],
        hard_ids_jsonl: [],
        findings: [],
        could_not_verify: ['repo_unreadable'],
        status: 'recommend_only',
        duration_ms: Date.now() - started,
      },
      args.out ? path.resolve(args.out) : null
    );
    process.exit(2);
  }

  const findings = [];
  const couldNotVerify = [];
  const requiredPaths = [
    'AGENTS.md',
    'skills',
    'eval/cases/HARD-cases.md',
    'memory/optimization/meta-patterns.md',
  ];
  const missingRequired = requiredPaths.filter((rel) => !fileExists(repo, rel));
  if (missingRequired.length > 0) {
    findings.push(
      makeFinding(
        'QP-6',
        'warn',
        { missing: missingRequired },
        'Restore required repo paths before treating scan output as healthy.'
      )
    );
    for (const rel of missingRequired) couldNotVerify.push(`missing:${rel}`);
  }

  const workingPath = 'memory/WORKING.md';
  let workingLineCount = null;
  let workingEvidenceFile = workingPath;
  if (fileExists(repo, workingPath)) {
    workingLineCount = countLines(repo, workingPath);
  } else if (runtime && fs.existsSync(path.join(runtime, workingPath))) {
    workingEvidenceFile = path.join(runtime, workingPath);
    workingLineCount = countLines(runtime, workingPath);
  } else if (!fileExists(repo, 'memory/WORKING.template.md')) {
    findings.push(
      makeFinding(
        'QP-16',
        'warn',
        { file: workingPath },
        'Restore memory/WORKING.md so open loops have a canonical home.'
      )
    );
    couldNotVerify.push('missing:memory/WORKING.md');
  }

  if (workingLineCount !== null && workingLineCount > 35) {
    findings.push(
      makeFinding(
        'MP-13',
        'warn',
        { file: workingEvidenceFile, line_count: workingLineCount, cap: 30 },
        'Trim WORKING.md to the ~30-line cap and map acceptance lines to evidence.'
      )
    );
  }

  const hardMdPath = 'eval/cases/HARD-cases.md';
  const hardJsonlPath = 'eval/cases/hard-cases.jsonl';
  let hardIdsMd = [];
  let hardIdsJsonl = [];
  const hardMdText = readText(repo, hardMdPath);
  if (hardMdText !== null) {
    hardIdsMd = [...extractHardIdsFromMd(hardMdText)].sort();
  } else {
    couldNotVerify.push(`missing:${hardMdPath}`);
  }
  const jsonlIds = extractHardIdsFromJsonl(repo, hardJsonlPath);
  hardIdsJsonl = [...jsonlIds].sort();
  if (hardMdText !== null && fileExists(repo, hardJsonlPath)) {
    const mdSet = new Set(hardIdsMd);
    const jsonlSet = new Set(hardIdsJsonl);
    const onlyMd = [...mdSet].filter((id) => !jsonlSet.has(id));
    const onlyJsonl = [...jsonlSet].filter((id) => !mdSet.has(id));
    if (onlyMd.length > 0 || onlyJsonl.length > 0) {
      findings.push(
        makeFinding(
          'QP-17',
          'warn',
          { only_in_md: onlyMd, only_in_jsonl: onlyJsonl },
          'Keep HARD-cases.md and hard-cases.jsonl ids in one canonical set.'
        )
      );
    }
  }

  if (hardMdText !== null && hardIdsMd.length === 0) {
    findings.push(
      makeFinding(
        'MP-13',
        'warn',
        { file: hardMdPath, hard_rows: 0 },
        'Add hard- eval rows before claiming requirements traceability.'
      )
    );
  }

  const skillFolders = listSkillFolders(repo);
  if (hardMdText !== null && skillFolders.length > 0) {
    const mdBody = hardMdText;
    const missingEval = skillFolders.filter((name) => !mdBody.includes(name));
    if (missingEval.length > 0) {
      findings.push(
        makeFinding(
          'MP-13',
          'warn',
          { skills_missing_eval: missingEval },
          'Mention each skill folder in HARD-cases.md or document an explicit eval exemption.'
        )
      );
    }
  }

  for (const rel of findSkillMdOutsideSkills(repo)) {
    findings.push(
      makeFinding(
        'MP-9',
        'warn',
        { file: rel },
        'Move SKILL.md under skills/ or mark the mirror as non-canonical.'
      )
    );
  }

  for (const rel of scanSkillsVaultClaims(repo)) {
    findings.push(
      makeFinding(
        'QP-1',
        'warn',
        { file: rel },
        'Point skills at Git repository (canonical) as SoT, not the Obsidian vault.'
      )
    );
  }

  for (const rel of scanMemorySecrets(repo)) {
    findings.push(
      makeFinding(
        'QP-1',
        'warn',
        { file: rel, redacted: true },
        'Remove secrets from memory markdown; store credentials outside Git.'
      )
    );
  }

  if (runtime) {
    if (!fs.existsSync(runtime)) {
      couldNotVerify.push(`runtime_missing:${runtime}`);
    } else {
      const diffs = compareRuntimeSkills(repo, runtime);
      if (diffs.length > 0) {
        findings.push(
          makeFinding(
            'QP-11',
            'warn',
            { files_differ: diffs },
            'Reconcile repo skills with runtime copies or document intentional drift.'
          )
        );
      }
    }
  }

  const result = {
    schema: 'thedojo.superninja.repo-scan.v1',
    repo,
    runtime,
    scanned_at: new Date().toISOString(),
    sot: 'Git repository (canonical)',
    working_line_count: workingLineCount,
    hard_ids_md: hardIdsMd,
    hard_ids_jsonl: hardIdsJsonl,
    findings,
    could_not_verify: couldNotVerify,
    status: 'recommend_only',
    duration_ms: Date.now() - started,
  };

  emit(result, args.out ? path.resolve(args.out) : null);
}

main();
