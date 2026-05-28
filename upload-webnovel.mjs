#!/usr/bin/env node
/**
 * Upload all chapters to WebNovel Inkstone as new (unpublished) chapters.
 *
 * Usage:  node upload-webnovel.mjs <auth-token>
 *
 * Get your auth token from browser DevTools:
 *   1. Open Inkstone in browser, open DevTools (F12) → Network tab
 *   2. Save or load any chapter
 *   3. Copy the Authorization header value from the request
 *   Tokens expire fast — grab a fresh one right before running.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/* ── Config ─────────────────────────────────────────── */
const BOOK_ID    = '35992175700130505';
const VOLUME_ID  = '96620368257064509';
const BASE_URL   = 'https://inkstone.webnovel.com/tauthorweb/chapter';
const SAVE_URL   = `${BASE_URL}/saveChapter`;
const PUBLISH_URL = `${BASE_URL}/publishChapter`;
const TOKEN_URL  = `${BASE_URL}/getAddPreBookChapter?CBID=${BOOK_ID}`;
const DELAY_MS   = 3000; // pause between uploads to dodge rate limits

/* ── Auth (refreshed automatically via API responses) ─ */
let authToken = process.argv[2];
const START_CHAPTER = parseInt(process.argv[3] || '26', 10); // optional: skip chapters before this number
if (!authToken) {
  console.error('Usage: node upload-webnovel.mjs <auth-token> [start-chapter]');
  console.error('');
  console.error('  start-chapter  Upload only chapters >= this number (default: 1)');
  console.error('  Example:       node upload-webnovel.mjs <token> 26');
  process.exit(1);
}

/* ── Paths ──────────────────────────────────────────── */
const CHAPTERS_DIR = join(
  process.cwd(),
  'books',
  'new-game-plus-the-last-of-us',
  'chapters'
);

/* ── Markdown → HTML ────────────────────────────────── */

/** Escape HTML special characters in raw text. */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Convert a markdown chapter to Inkstone-compatible HTML.
 *  - Each non-empty line → <p>
 *  - Scene breaks (____) → <p>* * *</p>
 *  - **bold** → <strong>
 *  - *italic* → <em>
 */
function markdownToHtml(md) {
  const lines = md.split('\n');
  const parts = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // skip blanks and the # title heading
    if (trimmed === '' || trimmed.startsWith('# ')) continue;

    // strip ## from POV switch headers (e.g. "## --Joel--" → "--Joel--")
    const stripped = trimmed.startsWith('## ') ? trimmed.slice(3) : trimmed;

    // scene breaks: ____, ---, ***, etc.
    if (/^[_\-*]{3,}$/.test(stripped)) {
      parts.push('<p>* * *</p>');
      continue;
    }

    // escape HTML entities first, then apply markdown formatting
    let html = escapeHtml(stripped);
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');   // bold
    html = html.replace(/(?<!\w)\*(?!\s)(.+?)(?<!\s)\*(?!\w)/g, '<em>$1</em>'); // italic

    parts.push(`<p>${html}</p>`);
  }

  return parts.join('');
}

/** Extract "Chapter N: Title" from the markdown heading. */
function extractTitle(md) {
  const match = md.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Untitled';
}

/* ── Upload ─────────────────────────────────────────── */

/**
 * Fetch a fresh CSRF token from the getAddPreBookChapter endpoint.
 * Also refreshes the auth JWT from the response.
 */
async function fetchToken() {
  const res = await fetch(TOKEN_URL, {
    headers: { Authorization: authToken },
  });
  const data = await res.json();

  if (data.result?.token) {
    // refresh auth JWT if the API returned a new one
    if (data.Authorization) authToken = data.Authorization;
    return data.result.token;
  }

  throw new Error(`Failed to get token: ${data.result?.msg || JSON.stringify(data)}`);
}

/** POST a new (unpublished) chapter to Inkstone. */
async function uploadChapter(title, htmlContent, csrfToken) {
  const payload = {
    CBID: BOOK_ID,
    bonusChapter: false,
    chapterTitle: title,
    chapterType: '-1',
    chapterextra: null,
    content: htmlContent,
    editorType: 1,
    isfinelayout: 1,
    jsonAnnotationMap: [],
    selectedCVID: VOLUME_ID,
    token: csrfToken,
    vipSelected: '-1',
  };

  const res = await fetch(SAVE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authToken,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  // refresh auth JWT if the API returned a new one
  if (data.Authorization) authToken = data.Authorization;
  return data;
}

/** Publish a saved chapter immediately. */
async function publishChapter(ccid) {
  const now = new Date();
  const date = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const payload = {
    CVID: VOLUME_ID,
    CCID: ccid,
    CBID: BOOK_ID,
    hasTimer: 0,
    date,
    time,
    isTestRepeatability: 1,
    timezone: 5.5,
  };

  const res = await fetch(PUBLISH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authToken,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (data.Authorization) authToken = data.Authorization;
  return data;
}

/* ── Main ───────────────────────────────────────────── */

async function main() {
  // collect and sort chapter files numerically
  const files = readdirSync(CHAPTERS_DIR)
    .filter(f => /^chapter-\d+\.md$/.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)[0], 10);
      const nb = parseInt(b.match(/\d+/)[0], 10);
      return na - nb;
    })
    .filter(f => parseInt(f.match(/\d+/)[0], 10) >= START_CHAPTER);

  console.log(`Found ${files.length} chapters in ${CHAPTERS_DIR}\n`);

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const md   = readFileSync(join(CHAPTERS_DIR, file), 'utf-8');
    const title = extractTitle(md);
    const html  = markdownToHtml(md);

    process.stdout.write(`[${i + 1}/${files.length}] ${title}... `);

    try {
      // fetch a fresh CSRF token before each save
      const csrfToken = await fetchToken();
      const result = await uploadChapter(title, html, csrfToken);

      if (result.result?.flag === true || result.result?.code === 0) {
        const ccid = result.result?.CCID;
        process.stdout.write(`saved${ccid ? ` (${ccid})` : ''}... `);

        // publish immediately after saving
        if (ccid) {
          const pubResult = await publishChapter(ccid);
          if (pubResult.result?.flag === true || pubResult.result?.code === 0) {
            console.log('published');
          } else {
            console.log(`saved but publish failed — ${pubResult.result?.msg || JSON.stringify(pubResult)}`);
          }
        } else {
          console.log('saved (no CCID, skipped publish)');
        }
        ok++;
      } else {
        console.log(`FAILED — ${result.result?.msg || JSON.stringify(result)}`);
        fail++;

        // bail early if auth is dead
        if (
          result.result?.code === 15 ||
          result.result?.code === 401 ||
          (result.result?.msg && /login|token|expire|unauthorized/i.test(result.result.msg))
        ) {
          console.error('\nAuth token expired or invalid. Grab a fresh one and retry.');
          break;
        }
      }
    } catch (err) {
      console.log(`ERROR — ${err.message}`);
      fail++;
    }

    // rate-limit pause
    if (i < files.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\nDone. ${ok} uploaded, ${fail} failed.`);
}

main().catch(console.error);
