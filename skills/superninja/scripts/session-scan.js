#!/usr/bin/env node
/**
 * Read-only session transcript scan for MP/QP patterns.
 * Never estimates tokens. usage absent → token_status unavailable, tokens null.
 *
 * Usage: node session-scan.js --root <dir> [--max-files N] [--max-lines N] [--out file]
 */
const fs = require('fs');
const path = require('path');

const SECRET_RE = /\b(sk-|ghp_|github_pat_|xox[baprs]-|BEGIN [A-Z ]+PRIVATE KEY)\S*/gi;
const DISCOVERY_TOOLS = new Set([
  'Glob',
  'Grep',
  'GetMcpTools',
  'SemanticSearch',
  'WebSearch',
]);

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

function redactDeep(value) {
  if (typeof value === 'string') return redact(value);
  if (Array.isArray(value)) return value.map(redactDeep);
  if (value && typeof value === 'object') {
    const next = {};
    for (const [k, v] of Object.entries(value)) next[k] = redactDeep(v);
    return next;
  }
  return value;
}

function isDiscoveryTool(name) {
  if (!name) return false;
  if (DISCOVERY_TOOLS.has(name)) return true;
  if (/^list_/i.test(name)) return true;
  if (/^search_/i.test(name)) return true;
  if (/^describe_/i.test(name)) return true;
  return false;
}

function collectJsonlFiles(root, maxFiles) {
  const found = [];
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
      if (!entry.isFile() || !entry.name.endsWith('.jsonl')) continue;
      const normalized = full.split(path.sep).join('/');
      const inAgentTranscripts = normalized.includes('agent-transcripts/');
      if (inAgentTranscripts || full.startsWith(root)) {
        try {
          const stat = fs.statSync(full);
          found.push({ file: full, mtime: stat.mtimeMs });
        } catch {
          /* skip unreadable */
        }
      }
    }
  }
  walk(root);
  const byPath = new Map();
  for (const item of found) byPath.set(item.file, item);
  return [...byPath.values()]
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, maxFiles)
    .map((x) => x.file);
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

function parseFile(filePath, maxLines) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch {
    return { skipped: true, events: [], linesSkipped: 0 };
  }
  const allLines = raw.split(/\r?\n/);
  const lines = maxLines ? allLines.slice(0, Number(maxLines)) : allLines;
  const events = [];
  let linesSkipped = 0;
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line));
    } catch {
      linesSkipped += 1;
    }
  }
  return { skipped: false, events, linesSkipped };
}

function extractToolCalls(events) {
  const allTools = [];
  const assistantMessages = [];
  for (const event of events) {
    const content = event.message?.content || [];
    const toolsInMessage = [];
    for (const part of content) {
      if (part.type !== 'tool_use') continue;
      const tool = { name: part.name || 'unknown', input: part.input || {}, event };
      allTools.push(tool);
      toolsInMessage.push(tool);
    }
    if (event.role === 'assistant') {
      assistantMessages.push(toolsInMessage);
    }
  }
  return { allTools, assistantMessages };
}

function detectFileFindings(filePath, events) {
  const findings = [];
  const relFile = filePath;
  const { allTools, assistantMessages } = extractToolCalls(events);

  let streak = 1;
  let maxStreak = 1;
  let streakTool = allTools[0]?.name;
  for (let i = 1; i < allTools.length; i += 1) {
    if (allTools[i].name === allTools[i - 1].name) {
      streak += 1;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 1;
      streakTool = allTools[i].name;
    }
    if (streak > 5 && streakTool === allTools[i].name) {
      /* track best streak per tool */
    }
  }
  streak = 1;
  for (let i = 1; i < allTools.length; i += 1) {
    if (allTools[i].name === allTools[i - 1].name) streak += 1;
    else streak = 1;
    if (streak > 5) {
      findings.push(
        makeFinding(
          'MP-1',
          'warn',
          { file: relFile, tool: allTools[i].name, consecutive_count: streak },
          'Replace the tool loop with a script or batch API call.'
        )
      );
      break;
    }
  }

  if (allTools.length >= 2) {
    const first2 = allTools.slice(0, 2).every((t) => isDiscoveryTool(t.name));
    const first3 = allTools.length >= 3 && allTools.slice(0, 3).every((t) => isDiscoveryTool(t.name));
    if (first2 || first3) {
      findings.push(
        makeFinding(
          'MP-3',
          'info',
          { file: relFile, first_tools: allTools.slice(0, Math.min(3, allTools.length)).map((t) => t.name) },
          'Inject known IDs and paths into the prompt instead of discovery-first calls.'
        )
      );
    }
  }

  const firstGlob = allTools.find((t) => t.name === 'Glob');
  if (firstGlob) {
    const pattern = firstGlob.input.glob_pattern || firstGlob.input.pattern || '';
    if (pattern === '**/*' || pattern === '**') {
      findings.push(
        makeFinding(
          'MP-4',
          'warn',
          { file: relFile, glob_pattern: pattern },
          'Start from a narrow glob or known path set instead of pull-everything.'
        )
      );
    }
  }

  let taskStreak = 0;
  for (const tools of assistantMessages) {
    const taskTools = tools.filter((t) => ['Task', 'Subagent'].includes(t.name));
    if (taskTools.length === 1 && tools.length === 1) taskStreak += 1;
    else taskStreak = 0;
    if (taskStreak >= 3) {
      findings.push(
        makeFinding(
          'MP-5',
          'warn',
          { file: relFile, consecutive_task_messages: taskStreak },
          'Launch independent work in one turn instead of serial subagent messages.'
        )
      );
      break;
    }
  }

  let resumeHit = false;
  let continuePrompts = 0;
  for (const tool of allTools) {
    if (!['Task', 'Subagent'].includes(tool.name)) continue;
    if (tool.input && tool.input.resume) resumeHit = true;
    const promptText = String(tool.input?.prompt || tool.input?.description || '');
    if (/^(continue|keep going)\b/i.test(promptText.trim())) continuePrompts += 1;
  }
  if (resumeHit || continuePrompts >= 2) {
    findings.push(
      makeFinding(
        'MP-15',
        'warn',
        { file: relFile, resume: resumeHit, continue_prompts: continuePrompts },
        'Synthesize subagent output in the parent instead of re-dispatching to continue.'
      )
    );
  }

  return findings;
}

function dedupeFindings(findings) {
  const seen = new Set();
  const out = [];
  for (const f of findings) {
    const key = `${f.id}:${JSON.stringify(f.evidence)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}

function emit(result, outPath) {
  const payload = redactDeep(result);
  const text = JSON.stringify(payload, null, 2);
  console.log(text);
  if (outPath) {
    fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
    fs.writeFileSync(outPath, text, 'utf8');
  }
}

function main() {
  const started = Date.now();
  const args = parseArgs(process.argv);
  if (!args.root) {
    console.error('Usage: node session-scan.js --root <dir> [--max-files N] [--max-lines N] [--out file]');
    process.exit(2);
  }
  const root = path.resolve(args.root);
  if (!fs.existsSync(root)) {
    console.error(`Root not found: ${root}`);
    emit(
      {
        schema: 'thedojo.superninja.session-scan.v1',
        source_root: root,
        scanned_at: new Date().toISOString(),
        files_scanned: 0,
        files_skipped: 0,
        lines_skipped: 0,
        token_status: 'unavailable',
        tokens: null,
        tool_calls: 0,
        findings: [],
        could_not_verify: ['no_transcripts'],
        status: 'recommend_only',
        duration_ms: Date.now() - started,
      },
      args.out ? path.resolve(args.out) : null
    );
    process.exit(2);
  }

  const maxFiles = args['max-files'] ? Number(args['max-files']) : 50;
  const maxLines = args['max-lines'] ? Number(args['max-lines']) : null;
  const files = collectJsonlFiles(root, maxFiles);

  let filesScanned = 0;
  let filesSkipped = 0;
  let linesSkipped = 0;
  let toolCalls = 0;
  let usageObjects = 0;
  const findings = [];
  const couldNotVerify = [];

  if (files.length === 0) {
    couldNotVerify.push('no_transcripts');
    findings.push(
      makeFinding(
        'QP-6',
        'warn',
        { reason: 'no_transcripts' },
        'Confirm transcript root path before claiming a healthy session scan.'
      )
    );
  }

  for (const filePath of files) {
    const parsed = parseFile(filePath, maxLines);
    if (parsed.skipped) {
      filesSkipped += 1;
      continue;
    }
    filesScanned += 1;
    linesSkipped += parsed.linesSkipped;
    for (const event of parsed.events) {
      if (event.usage || event.message?.usage) usageObjects += 1;
      const content = event.message?.content || [];
      for (const part of content) {
        if (part.type === 'tool_use') toolCalls += 1;
      }
    }
    findings.push(...detectFileFindings(filePath, parsed.events));
  }

  const result = {
    schema: 'thedojo.superninja.session-scan.v1',
    source_root: root,
    scanned_at: new Date().toISOString(),
    files_scanned: filesScanned,
    files_skipped: filesSkipped,
    lines_skipped: linesSkipped,
    token_status: usageObjects > 0 ? 'partial_or_complete' : 'unavailable',
    tokens: null,
    tool_calls: toolCalls,
    findings: dedupeFindings(findings),
    could_not_verify: couldNotVerify,
    status: 'recommend_only',
    duration_ms: Date.now() - started,
  };

  emit(result, args.out ? path.resolve(args.out) : null);
}

main();
