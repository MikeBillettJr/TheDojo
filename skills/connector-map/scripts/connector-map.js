#!/usr/bin/env node
/**
 * Read-only MCP connector inventory. Never prints env values. Never writes.
 *
 *   node skills/connector-map/scripts/connector-map.js --mcp-file <mcp.json>
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SECRET_RE = /\b(sk-|ghp_|github_pat_|xox[baprs]-|BEGIN [A-Z ]+PRIVATE KEY)\S*/gi;

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

function parseArgs(argv) {
  let mcpFile = null;
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--mcp-file') mcpFile = argv[++i];
  }
  return { mcpFile };
}

function verbFor(name) {
  const n = String(name).toLowerCase();
  if (/gmail|mail|slack|twitter/.test(n) && !/read/.test(n)) return 'draft';
  if (/x-read|x_read/.test(n)) return 'read';
  if (/github|git/.test(n)) return 'read';
  return 'read';
}

function envKeyNames(cfg) {
  if (!cfg || typeof cfg !== 'object' || !cfg.env || typeof cfg.env !== 'object') return [];
  return Object.keys(cfg.env).sort();
}

function mapFile(mcpFile) {
  if (!mcpFile || !fs.existsSync(mcpFile)) {
    return {
      kind: 'missing',
      recommend_only: true,
      wrote: false,
      send_allowed: false,
      could_not_verify: 'mcp.json not found',
      servers: [],
    };
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(mcpFile, 'utf8'));
  } catch (e) {
    return {
      kind: 'invalid',
      recommend_only: true,
      wrote: false,
      send_allowed: false,
      could_not_verify: 'mcp.json not valid JSON',
      servers: [],
    };
  }
  const serversObj = (parsed && parsed.mcpServers && typeof parsed.mcpServers === 'object')
    ? parsed.mcpServers
    : {};
  const servers = Object.keys(serversObj).sort().map((name) => {
    const cfg = serversObj[name] || {};
    return {
      name,
      verb: verbFor(name),
      send_allowed: false,
      transport: cfg.type || (cfg.command ? 'stdio' : (cfg.url ? 'url' : 'unknown')),
      has_command: Boolean(cfg.command),
      has_url: Boolean(cfg.url),
      env_keys: envKeyNames(cfg),
    };
  });
  return {
    kind: servers.length ? 'mapped' : 'empty',
    recommend_only: true,
    wrote: false,
    send_allowed: false,
    servers,
    merge_plan: [
      {
        action: 'Keep send gated. Draft memory/connectors.md only after the operator names that write.',
      },
    ],
  };
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.mcpFile) {
    process.stderr.write('connector-map: --mcp-file <path> is required.\n');
    process.stdout.write(`${JSON.stringify({ pass: false, error: 'missing --mcp-file' })}\n`);
    process.exit(1);
  }
  const report = redactDeep(mapFile(path.resolve(args.mcpFile)));
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(0);
}

if (require.main === module) main();

module.exports = { mapFile, verbFor, redactDeep };
