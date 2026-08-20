#!/usr/bin/env node
/**
 * Append scan fingerprints and compare pattern counts over time.
 * Counts only — no health scores, no invented %.
 *
 * Usage:
 *   node regression-report.js --append <pipeline.json> [--history file]
 *   node regression-report.js --history <file>
 */
const fs = require('fs');
const path = require('path');

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

function collectFindings(pipeline) {
  const bags = [pipeline, pipeline.session, pipeline.vault, pipeline.repo];
  const findings = [];
  for (const bag of bags) {
    if (bag && Array.isArray(bag.findings)) findings.push(...bag.findings);
  }
  return findings;
}

function summarize(pipeline) {
  const findings = collectFindings(pipeline);
  const pattern_counts = {};
  for (const f of findings) {
    const id = f.pattern || f.id;
    if (!id) continue;
    pattern_counts[id] = (pattern_counts[id] || 0) + 1;
  }
  const session = pipeline.session || {};
  return {
    schema: 'thedojo.superninja.history.v1',
    scanned_at: pipeline.scanned_at || new Date().toISOString(),
    duration_ms: typeof pipeline.duration_ms === 'number' ? pipeline.duration_ms : null,
    files_scanned: typeof session.files_scanned === 'number' ? session.files_scanned : null,
    finding_count: findings.length,
    pattern_counts,
    token_status: session.token_status || null,
  };
}

function trend(before, after) {
  if (after > before) return 'worse';
  if (after < before) return 'better';
  return 'same';
}

function compareRows(prev, curr) {
  const keys = new Set([
    ...Object.keys(prev.pattern_counts || {}),
    ...Object.keys(curr.pattern_counts || {}),
  ]);
  const patterns = {};
  for (const key of [...keys].sort()) {
    const before = prev.pattern_counts[key] || 0;
    const after = curr.pattern_counts[key] || 0;
    patterns[key] = {
      before,
      after,
      delta: after - before,
      trend: trend(before, after),
    };
  }
  const fcBefore = prev.finding_count || 0;
  const fcAfter = curr.finding_count || 0;
  return {
    schema: 'thedojo.superninja.regression.v1',
    from: prev.scanned_at,
    to: curr.scanned_at,
    finding_count: {
      before: fcBefore,
      after: fcAfter,
      delta: fcAfter - fcBefore,
      trend: trend(fcBefore, fcAfter),
    },
    patterns,
    status: 'recommend_only',
  };
}

function readHistory(historyPath) {
  if (!fs.existsSync(historyPath)) return [];
  const text = fs.readFileSync(historyPath, 'utf8');
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line));
    } catch {
      /* skip malformed */
    }
  }
  return rows;
}

function main() {
  const args = parseArgs(process.argv);
  const repoRoot = path.resolve(__dirname, '../../..');
  const historyPath = args.history
    ? path.resolve(args.history)
    : path.join(repoRoot, 'eval', 'superninja', 'history.jsonl');

  if (args.append) {
    const pipeline = JSON.parse(fs.readFileSync(path.resolve(args.append), 'utf8'));
    const row = summarize(pipeline);
    fs.mkdirSync(path.dirname(historyPath), { recursive: true });
    fs.appendFileSync(historyPath, `${JSON.stringify(row)}\n`, 'utf8');
    console.log(JSON.stringify(row, null, 2));
    process.exit(0);
  }

  const rows = readHistory(historyPath);
  if (rows.length < 2) {
    console.log(
      JSON.stringify(
        {
          schema: 'thedojo.superninja.regression.v1',
          status: 'recommend_only',
          could_not_verify: rows.length === 0 ? ['no_history'] : ['need_two_scans'],
          rows: rows.length,
        },
        null,
        2
      )
    );
    process.exit(0);
  }

  const report = compareRows(rows[rows.length - 2], rows[rows.length - 1]);
  console.log(JSON.stringify(report, null, 2));
}

main();
