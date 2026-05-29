#!/usr/bin/env node
/**
 * Bulk-publish already-saved chapters on WebNovel Inkstone.
 *
 * Usage:  node publish-webnovel.mjs <auth-token> <CCID,CCID,...>
 *
 * Example (publish chapters 2-25):
 *   node publish-webnovel.mjs <token> 96620384228529890,96620388389287996,...
 *
 * Get CCIDs from the upload script output or from Inkstone's chapter list.
 */

/* ── Config ─────────────────────────────────────────── */
const BOOK_ID   = '35992175700130505';
const VOLUME_ID = '96620368257064509';
const PUBLISH_URL = 'https://inkstone.webnovel.com/tauthorweb/chapter/publishChapter';
const DELAY_MS  = 2000;

/* ── Auth ───────────────────────────────────────────── */
let authToken = process.argv[2];
const ccidArg  = process.argv[3];

if (!authToken || !ccidArg) {
  console.error('Usage: node publish-webnovel.mjs <auth-token> <CCID,CCID,...>');
  console.error('');
  console.error('  Comma-separated list of CCIDs to publish.');
  process.exit(1);
}

const ccids = ccidArg.split(',').map(s => s.trim()).filter(Boolean);

/* ── Publish ────────────────────────────────────────── */

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
  console.log(`Publishing ${ccids.length} chapters...\n`);

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < ccids.length; i++) {
    const ccid = ccids[i];
    process.stdout.write(`[${i + 1}/${ccids.length}] CCID ${ccid}... `);

    try {
      const result = await publishChapter(ccid);

      if (result.result?.flag === true || result.result?.code === 0) {
        console.log('OK');
        ok++;
      } else {
        console.log(`FAILED — ${result.result?.msg || JSON.stringify(result)}`);
        fail++;

        if (
          result.result?.code === 15 ||
          result.result?.code === 401 ||
          (result.result?.msg && /login|token|expire|unauthorized/i.test(result.result.msg))
        ) {
          console.error('\nAuth token expired. Grab a fresh one and retry.');
          break;
        }
      }
    } catch (err) {
      console.log(`ERROR — ${err.message}`);
      fail++;
    }

    if (i < ccids.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\nDone. ${ok} published, ${fail} failed.`);
}

main().catch(console.error);
