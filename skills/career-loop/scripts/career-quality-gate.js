#!/usr/bin/env node
/**
 * Portable career packet quality gate. Fail-closed. Does not submit.
 *
 *   node career-quality-gate.js --packet <packetRoot> [--md-only] [--no-write]
 */
'use strict';

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = { packet: null, noWrite: false, mdOnly: false };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--packet') out.packet = argv[++i];
    else if (argv[i] === '--no-write') out.noWrite = true;
    else if (argv[i] === '--md-only') out.mdOnly = true;
  }
  return out;
}

function read(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function wordCount(t) {
  return (t.trim().match(/\S+/g) || []).length;
}

function bulletCount(t) {
  return (t.match(/^\s*[-*]\s+/gm) || []).length;
}

function firstParagraph(t) {
  const stripped = String(t || '')
    .replace(/^#.*$/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/^(https?:\/\/)?(www\.)?linkedin\.com.*$/gim, '')
    .trim();
  const parts = stripped
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  for (const part of parts) {
    const words = (part.match(/\S+/g) || []).length;
    const hasI = /\b(I|I've|I am|Here's what I've|Here's what I)\b/i.test(part);
    if (hasI || words >= 12) return part;
  }
  return parts[0] || '';
}

function readCoverMd(packet) {
  const build = path.join(packet, 'build');
  for (const name of ['cover.md', 'cover-letter.md']) {
    const p = path.join(build, name);
    const text = read(p);
    if (text.trim()) return { text, path: p };
  }
  return { text: '', path: path.join(build, 'cover.md') };
}

function sectionBody(text, heading) {
  const re = new RegExp(`##\\s*${heading}\\s*([\\s\\S]*?)(?=##\\s|$)`, 'i');
  const m = String(text || '').match(re);
  return m ? m[1] : '';
}

function personSectionStatus(body) {
  const raw = String(body || '').trim();
  if (!raw) return 'missing';
  if (/could_not_verify/i.test(raw)) return 'ok';
  const hasSource = /\bSource\s*:/i.test(raw);
  const nameLine = raw.match(/\*?Name\*?\s*:\s*(.+)/i);
  const nameVal = (nameLine && nameLine[1] ? nameLine[1] : '').replace(/\*+/g, '').trim();
  if (nameVal && !/^could_not_verify/i.test(nameVal) && !hasSource) return 'invented';
  if (!hasSource) return 'invented';
  return 'ok';
}

function isExplainerOpen(opener) {
  const first = (opener || '').slice(0, 280);
  if (/\b(I|I've|I am|Here's what I've|Here's what I)\b/i.test(first)) return false;
  return /^[A-Z][\w .&'/-]{1,70}\b(is|are|sits|sells|helps|provides|builds|makes|tries|trying to)\b/i.test(
    first
  );
}

function loadResumeQa(packet) {
  const qaDir = path.join(packet, 'qa');
  if (!fs.existsSync(qaDir)) return null;
  const files = fs.readdirSync(qaDir).filter((f) => /resume.*render-qa\.json$/i.test(f) || f === 'resume-render-qa.json');
  if (!files.length) return null;
  try {
    return JSON.parse(fs.readFileSync(path.join(qaDir, files[0]), 'utf8'));
  } catch (e) {
    return null;
  }
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.packet) {
    process.stderr.write('Usage: node career-quality-gate.js --packet <packetRoot> [--md-only] [--no-write]\n');
    process.exit(2);
  }
  const packet = path.resolve(args.packet);
  const resumeMd = read(path.join(packet, 'build', 'resume.md'));
  const coverLoaded = readCoverMd(packet);
  const coverMd = coverLoaded.text;
  const failures = [];

  if (!resumeMd.trim()) failures.push({ id: 'resume_md_missing', message: 'build/resume.md missing or empty' });
  if (!coverMd.trim()) {
    failures.push({ id: 'cover_md_missing', message: 'build/cover.md missing or empty (cover-letter.md alias OK)' });
  }

  const hasSkills = /^##\s+Skills\b/im.test(resumeMd);
  if (resumeMd && !hasSkills) {
    failures.push({ id: 'resume_skills_section', message: 'Resume has no ## Skills section' });
  }

  const bullets = bulletCount(resumeMd);
  if (resumeMd && bullets < 16) {
    failures.push({ id: 'resume_bullet_floor', message: `Resume has ${bullets} bullets; floor is 16` });
  }

  const rWords = wordCount(resumeMd);
  if (resumeMd && rWords < 600) {
    failures.push({ id: 'resume_word_floor', message: `Resume is ${rWords} words; floor is 600 (1-pager squeeze)` });
  }

  let qa = null;
  if (!args.mdOnly) {
    qa = loadResumeQa(packet);
    if (!qa) {
      failures.push({ id: 'resume_render_qa_missing', message: 'qa resume render-qa JSON missing' });
    } else {
      const pages = Number(qa.pages);
      const pass = qa.pass === true || qa.status === 'PASS';
      if (!pass) failures.push({ id: 'resume_render_qa_fail', message: 'resume render-qa is not PASS' });
      if (Number.isFinite(pages) && pages < 2) {
        failures.push({ id: 'resume_page_floor', message: `Resume PDF is ${pages} page(s); floor is 2` });
      }
      if (Number.isFinite(pages) && pages > 2) {
        failures.push({ id: 'resume_page_ceiling', message: `Resume PDF is ${pages} pages; ceiling is 2` });
      }
    }
  }

  if (coverMd && !/linkedin\.com\/in\//i.test(coverMd)) {
    failures.push({ id: 'cover_letterhead', message: 'Cover missing a LinkedIn URL (linkedin.com/in/...)' });
  }

  const cWords = wordCount(coverMd);
  if (coverMd && cWords < 220) {
    failures.push({ id: 'cover_word_floor', message: `Cover is ${cWords} words; floor is 220` });
  }

  const opener = firstParagraph(coverMd);
  if (coverMd && isExplainerOpen(opener)) {
    failures.push({
      id: 'cover_company_explainer_open',
      message: 'Cover opens as a company explainer. Open with a first-person lived hook.',
    });
  }
  if (coverMd && !/\b(I|I've|I am|Here's what I've|Here's what I)\b/i.test(opener.slice(0, 400))) {
    failures.push({ id: 'cover_first_person_hook', message: 'Cover first paragraph has no first-person hook' });
  }
  if (/I am not going to pretend|NEED MIKE|BLOCKING|do not auto-Yes/i.test(coverMd)) {
    failures.push({ id: 'cover_agent_notes_leaked', message: 'Cover contains agent working notes' });
  }
  if (/I build the AI systems that sellers actually run daily/i.test(coverMd)) {
    failures.push({ id: 'cover_stock_ai_hook', message: 'Cover uses the banned stock AI hook' });
  }
  if (/\u2014/.test(resumeMd) || /\u2014/.test(coverMd)) {
    failures.push({ id: 'em_dash_ai_tell', message: 'Resume or cover contains an em dash (U+2014)' });
  }
  if (/I know you volunteer|I saw you have kids|I saw you volunteer|I noticed you have (kids|children)/i.test(coverMd)) {
    failures.push({ id: 'cover_dossier_personalization', message: 'Cover quotes their bio/family. Change OUR story instead.' });
  }

  const peoplePath = path.join(packet, 'freeze', 'people-research.md');
  const peopleText = read(peoplePath);
  if (!peopleText.trim()) {
    failures.push({
      id: 'people_research_missing',
      message: 'freeze/people-research.md missing — HM + recruiter with source or could_not_verify',
    });
  } else {
    const hm = personSectionStatus(sectionBody(peopleText, 'Hiring manager'));
    const rec = personSectionStatus(sectionBody(peopleText, 'Recruiter'));
    if (hm === 'missing' || rec === 'missing') {
      failures.push({ id: 'people_research_incomplete', message: 'Need Hiring manager and Recruiter sections' });
    }
    if (hm === 'invented' || rec === 'invented') {
      failures.push({
        id: 'people_research_invented',
        message: 'Named a person without a source — use could_not_verify',
      });
    }
    if (!/##\s*Notes\b/i.test(peopleText)) {
      failures.push({ id: 'people_research_notes_missing', message: 'people-research.md needs ## Notes' });
    }
  }

  const result = {
    schema: 'career-quality-gate.v1',
    verb: 'career-quality-gate',
    checked_at: new Date().toISOString(),
    packet,
    status: failures.length ? 'FAIL' : 'PASS',
    send_allowed: false,
    failures,
    measured: {
      resume_words: rWords,
      resume_bullets: bullets,
      resume_has_skills: hasSkills,
      resume_pages: qa && qa.pages,
      cover_words: cWords,
      cover_path: coverLoaded.path,
    },
  };

  let outPath = null;
  if (!args.noWrite) {
    const qaDir = path.join(packet, 'qa');
    fs.mkdirSync(qaDir, { recursive: true });
    outPath = path.join(qaDir, 'career-quality-gate.json');
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  }
  process.stdout.write(`${JSON.stringify({ ...result, out: outPath }, null, 2)}\n`);
  process.exit(failures.length ? 4 : 0);
}

main();
