#!/usr/bin/env node
/**
 * Held-out skill gate. Scores a candidate SKILL.md vs live (or as a new skill).
 * Never writes skills/. Refuses --write / --apply / --live.
 *
 *   node skill-gate.js --skill <name> [--candidate <path>] [--root <osRoot>] [--no-write]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SCRIPT_REPO = path.resolve(__dirname, '../../..');
const FORBIDDEN_FLAGS = new Set(['--write', '--apply', '--in-place', '--live', '--overwrite']);

const BUNDLED_RAILS = {
  defaults: [
    { id: 'when_to_use', pattern: 'When to use', flags: 'i' },
    { id: 'fail_closed', pattern: 'Failures to refuse|When not to use', flags: 'i' },
  ],
  skills: {},
};

function die(message, code = 1) {
  const report = {
    schema: 'skill-gate.v1',
    pass: false,
    abort: true,
    wrote: false,
    error: message,
  };
  process.stderr.write(`${message}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(code);
}

function parseArgs(argv) {
  for (const a of argv.slice(2)) {
    if (FORBIDDEN_FLAGS.has(a)) {
      die(`skill-gate abort: ${a} would target live skills. Stage a report only.`);
    }
  }
  const out = {
    skill: null,
    candidate: null,
    out: null,
    root: SCRIPT_REPO,
    noWrite: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--skill') out.skill = argv[++i];
    else if (argv[i] === '--candidate') out.candidate = argv[++i];
    else if (argv[i] === '--out') out.out = argv[++i];
    else if (argv[i] === '--root') out.root = path.resolve(argv[++i]);
    else if (argv[i] === '--no-write') out.noWrite = true;
  }
  return out;
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function lineCount(text) {
  if (!text) return 0;
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return (normalized.endsWith('\n') ? normalized.slice(0, -1) : normalized).split('\n').length;
}

function frontmatter(text) {
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  return match ? match[1] : '';
}

function unquote(value) {
  const trimmed = value.trim();
  if (
    trimmed.length >= 2
    && ((trimmed.startsWith('"') && trimmed.endsWith('"'))
      || (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseSkillMetadata(text) {
  const yaml = frontmatter(text);
  const nameMatch = yaml.match(/^name:\s*(.*?)\s*$/m);
  const lines = yaml.replace(/\r\n/g, '\n').split('\n');
  const descriptionIndex = lines.findIndex((line) => /^description\s*:/.test(line));
  let description = '';
  if (descriptionIndex >= 0) {
    const first = lines[descriptionIndex].replace(/^description\s*:\s*/, '');
    if (/^>-?\s*$/.test(first)) {
      const folded = [];
      for (let i = descriptionIndex + 1; i < lines.length; i += 1) {
        const line = lines[i];
        if (line.trim() === '') {
          folded.push('');
          continue;
        }
        if (!/^\s+/.test(line)) break;
        folded.push(line.trim());
      }
      description = folded.join(' ').replace(/\s+/g, ' ').trim();
    } else {
      description = unquote(first);
    }
  }
  return {
    name: nameMatch ? unquote(nameMatch[1]) : '',
    description,
  };
}

function catalogTrigger(text) {
  let trigger = '';
  const descBlock = text.match(/^description:\s*>-?\s*\n((?:  .*\n)+)/m);
  const descLine = text.match(/^description:\s*(.+)$/m);
  if (descBlock) trigger = descBlock[1].replace(/^\s+/gm, ' ').replace(/\s+/g, ' ').trim();
  else if (descLine) trigger = descLine[1].replace(/^>-?\s*/, '').trim();
  if (!trigger) {
    const when = text.match(/\*\*When to use:\*\*\s*(.+)/);
    if (when) trigger = when[1].trim();
  }
  return trigger.slice(0, 140);
}

function triggerQuality(trigger) {
  return Boolean(trigger) && trigger.length >= 20 && trigger !== '>';
}

function specCheck(folder, text) {
  const metadata = parseSkillMetadata(text);
  const lines = lineCount(text);
  const nameSyntax = /^(?!-)(?!.*--)[a-z0-9-]{1,64}(?<!-)$/.test(metadata.name);
  const nameMatchesFolder = metadata.name === folder;
  const descriptionLength = metadata.description.length;
  const descriptionValid = descriptionLength >= 1 && descriptionLength <= 1024;
  const lineCountValid = lines <= 500;
  return {
    pass: Boolean(text) && nameSyntax && nameMatchesFolder && descriptionValid && lineCountValid,
    observed: {
      frontmatter_name: metadata.name,
      description_length: descriptionLength,
      line_count: lines,
    },
  };
}

function loadRails(root) {
  const p = path.join(root, 'eval', 'scripts', 'skill-rails.json');
  if (!fs.existsSync(p)) return BUNDLED_RAILS;
  try {
    const doc = JSON.parse(read(p));
    return {
      defaults: Array.isArray(doc.defaults) ? doc.defaults : BUNDLED_RAILS.defaults,
      skills: doc.skills && typeof doc.skills === 'object' ? doc.skills : {},
    };
  } catch (e) {
    return BUNDLED_RAILS;
  }
}

function railsFor(skill, railsDoc) {
  const extras = (railsDoc.skills && railsDoc.skills[skill]) || [];
  return [...(railsDoc.defaults || []), ...extras];
}

function scoreCorpus(corpus, rails) {
  return rails.map((rail) => {
    const re = new RegExp(rail.pattern, rail.flags || '');
    return { id: rail.id, pass: re.test(corpus), pattern: rail.pattern };
  });
}

function underSkills(file, skillsDir) {
  const resolved = path.resolve(file);
  const root = path.resolve(skillsDir) + path.sep;
  return resolved.startsWith(root) || resolved === path.resolve(skillsDir);
}

function evaluate(args) {
  const skillsDir = path.join(args.root, 'skills');
  const livePath = path.join(skillsDir, args.skill, 'SKILL.md');
  const liveExists = fs.existsSync(livePath);
  const kind = liveExists ? 'revision' : 'new_skill';

  if (!liveExists && !args.candidate) {
    return { error: `unknown skill: ${args.skill}` };
  }

  const railsDoc = loadRails(args.root);
  const rails = railsFor(args.skill, railsDoc);
  const baselineText = liveExists ? read(livePath) : '';
  const baselineSpec = liveExists ? specCheck(args.skill, baselineText) : { pass: false };
  const baselineTrigger = liveExists ? catalogTrigger(baselineText) : '';
  const baselineRails = liveExists ? scoreCorpus(baselineText, rails) : rails.map((r) => ({ id: r.id, pass: false, pattern: r.pattern }));
  const baselinePassCount = liveExists
    ? baselineRails.filter((r) => r.pass).length
      + (baselineSpec.pass ? 1 : 0)
      + (triggerQuality(baselineTrigger) ? 1 : 0)
    : 0;
  const baselineTotal = rails.length + 2;

  const usingCandidate = Boolean(args.candidate);
  const candidateAbs = usingCandidate ? path.resolve(args.candidate) : livePath;
  if (usingCandidate && !fs.existsSync(candidateAbs)) {
    return { error: `candidate not found: ${candidateAbs}` };
  }

  const candidateText = usingCandidate ? read(candidateAbs) : baselineText;
  const candidateSpec = specCheck(args.skill, candidateText);
  const candidateTrigger = catalogTrigger(candidateText);
  const candidateRails = scoreCorpus(candidateText, rails);
  const candidatePassCount = candidateRails.filter((r) => r.pass).length
    + (candidateSpec.pass ? 1 : 0)
    + (triggerQuality(candidateTrigger) ? 1 : 0);

  const dropped = [];
  if (liveExists) {
    for (const rail of baselineRails) {
      const after = candidateRails.find((r) => r.id === rail.id);
      if (rail.pass && after && !after.pass) dropped.push(rail.id);
    }
  }

  const candidateRejected = !candidateSpec.pass
    || !triggerQuality(candidateTrigger)
    || candidateRails.some((r) => !r.pass)
    || dropped.length > 0
    || (liveExists && candidatePassCount < baselinePassCount);

  const pass = usingCandidate ? !candidateRejected : (liveExists ? !candidateRejected : false);

  return {
    schema: 'skill-gate.v1',
    verb: 'skill-gate',
    kind,
    pass,
    skill: args.skill,
    wrote: false,
    send_allowed: false,
    baseline: {
      path: liveExists ? livePath : null,
      exists: liveExists,
      score: { pass: baselinePassCount, total: baselineTotal },
      spec: baselineSpec.pass,
      trigger: { value: baselineTrigger, pass: triggerQuality(baselineTrigger) },
      rails: baselineRails,
    },
    candidate: {
      path: candidateAbs,
      score: { pass: candidatePassCount, total: baselineTotal },
      spec: candidateSpec.pass,
      trigger: { value: candidateTrigger, pass: triggerQuality(candidateTrigger) },
      rails: candidateRails,
      dropped_rails: dropped,
      rejected: usingCandidate ? candidateRejected : false,
    },
    notes: usingCandidate
      ? (candidateRejected
        ? 'Candidate rejected. Live SKILL.md not written.'
        : 'Candidate matches or beats baseline. Stage only — live SKILL.md not written.')
      : 'Baseline report only. Live SKILL.md not written.',
  };
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.skill) die('skill-gate abort: --skill <name> is required.');

  const skillsDir = path.join(args.root, 'skills');
  const defaultOut = path.join(args.root, 'eval', 'staged', `${args.skill}-gate.json`);
  const outPath = args.out ? path.resolve(args.out) : defaultOut;
  if (!args.noWrite && underSkills(outPath, skillsDir)) {
    die('skill-gate abort: --out cannot land under skills/.');
  }

  const report = evaluate(args);
  if (report.error) die(`skill-gate abort: ${report.error}`);

  let written = null;
  if (!args.noWrite) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    written = outPath;
  }
  process.stdout.write(`${JSON.stringify({ ...report, out: written }, null, 2)}\n`);
  process.exit(report.pass ? 0 : 1);
}

if (require.main === module) main();

module.exports = { evaluate, parseArgs };
