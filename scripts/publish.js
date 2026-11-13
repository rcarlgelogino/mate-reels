// Publish one reel to Instagram (Graph API, resumable upload: the video goes straight from this machine to Meta, no public URL needed).
// usage: node scripts/publish.js <video.mp4> [caption.txt] [--dry-run]
// env: IG_USER_ID, META_PAGE_TOKEN (page token of the linked Facebook page) or IG_TOKEN. Tokens are never printed.
const fs = require('fs'), path = require('path');
const V = process.env.GRAPH_VERSION || 'v21.0';
const IG = process.env.IG_USER_ID, TOKEN = process.env.META_PAGE_TOKEN || process.env.IG_TOKEN;
const [video, capFile] = process.argv.slice(2).filter(a => !a.startsWith('--')); const DRY = process.argv.includes('--dry-run');
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const scrub = s => String(s).replace(/EAA[A-Za-z0-9]+|IG[A-Za-z0-9]{20,}/g, '[token]');
async function api(method, url, body, headers = {}) {
  const r = await fetch(url, { method, headers: { ...headers }, body }); const txt = await r.text(); let j; try { j = JSON.parse(txt); } catch { j = { raw: txt.slice(0, 300) }; }
  if (!r.ok || j.error) { const e = new Error(scrub(`${r.status} ${JSON.stringify(j.error || j).slice(0, 400)}`)); e.status = r.status; throw e; } return j; }
(async () => {
  if (!video || !fs.existsSync(video)) { console.error('usage: node scripts/publish.js <video.mp4> [caption.txt] [--dry-run]'); process.exit(2); }
  if (!IG || !TOKEN) { console.error('IG_USER_ID and META_PAGE_TOKEN (or IG_TOKEN) must be set'); process.exit(2); }
  const caption = capFile && fs.existsSync(capFile) ? fs.readFileSync(capFile, 'utf8').trim().slice(0, 2200) : '';
  const size = fs.statSync(video).size; log('video', path.basename(video), (size / 1e6).toFixed(1) + ' MB', '| caption', caption.length, 'chars');
  const G = `https://graph.facebook.com/${V}`;
  // 0. sanity check: the token can see the Instagram account
  const me = await api('GET', `${G}/${IG}?fields=username&access_token=${encodeURIComponent(TOKEN)}`); log('instagram account:', '@' + me.username);
  if (DRY) { log('dry run: nothing uploaded'); return; }
  // 1. create a resumable REELS container
  const params = new URLSearchParams({ media_type: 'REELS', upload_type: 'resumable', caption, share_to_feed: 'true', access_token: TOKEN });
  const c = await api('POST', `${G}/${IG}/media`, params); log('container', c.id);
  // 2. upload the bytes
  const up = await api('POST', c.uri || `https://rupload.facebook.com/ig-api-upload/${V}/${c.id}`, fs.readFileSync(video), { Authorization: `OAuth ${TOKEN}`, offset: '0', file_size: String(size) });
  log('upload', up.success ? 'ok' : JSON.stringify(up).slice(0, 120));
  // 3. wait until Instagram has processed the video
  let st = ''; for (let i = 0; i < 60; i++) { await new Promise(r => setTimeout(r, 10000)); const s = await api('GET', `${G}/${c.id}?fields=status_code,status&access_token=${encodeURIComponent(TOKEN)}`); st = s.status_code; log('status', st); if (st === 'FINISHED') break; if (st === 'ERROR' || st === 'EXPIRED') throw new Error('processing failed: ' + scrub(s.status || st)); }
  if (st !== 'FINISHED') throw new Error('processing timed out');
  // 4. publish
  const pub = await api('POST', `${G}/${IG}/media_publish`, new URLSearchParams({ creation_id: c.id, access_token: TOKEN }));
  let link = ''; try { link = (await api('GET', `${G}/${pub.id}?fields=permalink&access_token=${encodeURIComponent(TOKEN)}`)).permalink; } catch {}
  log('PUBLISHED', pub.id, link); if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `permalink=${link}\n`);
})().catch(e => { console.error('PUBLISH FAILED:', scrub(e.message)); process.exit(1); });
