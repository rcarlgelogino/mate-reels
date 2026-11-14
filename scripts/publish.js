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
  if (!IG || !TOKEN) { console.error('missing:', [!IG && 'IG_USER_ID', !TOKEN && 'META_PAGE_TOKEN (or IG_TOKEN)'].filter(Boolean).join(', '), '- add them under Settings > Secrets and variables > Actions > Secrets (repository secrets)'); process.exit(2); }
  const caption = capFile && fs.existsSync(capFile) ? fs.readFileSync(capFile, 'utf8').trim().slice(0, 2200) : '';
  const size = fs.statSync(video).size; log('video', path.basename(video), (size / 1e6).toFixed(1) + ' MB', '| caption', caption.length, 'chars');
  const G = `https://graph.facebook.com/${V}`;
  // 0. sanity check: the token can see the Instagram account
  const me = await api('GET', `${G}/${IG}?fields=username&access_token=${encodeURIComponent(TOKEN)}`); log('instagram account:', '@' + me.username);
  if (DRY) { log('dry run: nothing uploaded'); return; }
  // waits until Instagram has processed a container; returns null when processing failed
  const waitReady = async id => { for (let i = 0; i < 60; i++) { await new Promise(r => setTimeout(r, 10000)); const s = await api('GET', `${G}/${id}?fields=status_code,status&access_token=${encodeURIComponent(TOKEN)}`); log('status', s.status_code);
      if (s.status_code === 'FINISHED') return true; if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') { log('processing failed:', scrub(s.status || s.status_code)); return null; } } log('processing timed out'); return null; };
  let c = null;
  // 1. preferred: Instagram fetches the video itself from its public address (the GitHub release), no byte upload needed
  if (process.env.VIDEO_URL) { try { let url = process.env.VIDEO_URL; const h = await fetch(url, { method: 'HEAD', redirect: 'manual' }); if (h.status >= 300 && h.status < 400 && h.headers.get('location')) url = h.headers.get('location');
      const v = await api('POST', `${G}/${IG}/media`, new URLSearchParams({ media_type: 'REELS', video_url: url, caption, share_to_feed: 'true', access_token: TOKEN })); log('container (video url)', v.id);
      if (await waitReady(v.id)) c = v; } catch (e) { log('video url way failed:', e.message.slice(0, 300)); } }
  if (!c) {
  // 2. fallback: resumable upload of the bytes
  const params = new URLSearchParams({ media_type: 'REELS', upload_type: 'resumable', caption, share_to_feed: 'true', access_token: TOKEN });
  // 2. upload the bytes (rupload wants the app USER token per Meta's docs; try the user token first, then the page token)
  const upTokens = [[process.env.META_USER_TOKEN, 'user token'], [TOKEN, 'page token']].filter(t => t[0]);
  const bytes = fs.readFileSync(video); let up = null, lastErr = null;
  for (const [tok, kind] of upTokens) {
    // a failed upload spoils its container, so every attempt gets a fresh one
    c = await api('POST', `${G}/${IG}/media`, params); log('container', c.id); const upUrl = c.uri || `https://rupload.facebook.com/ig-api-upload/${V}/${c.id}`;
    try { up = await api('POST', upUrl, bytes, { Authorization: `OAuth ${tok}`, offset: '0', file_size: String(size), 'Content-Type': 'application/octet-stream' }); log('upload ok with', kind); break; }
    catch (e) { lastErr = e; log('upload with', kind, 'failed:', e.message.slice(0, 300)); }
  }
  if (!up) { log(process.env.META_USER_TOKEN ? 'hint: the byte upload (rupload) was rejected; if the video url way failed too, check the app dashboard on developers.facebook.com for restrictions' : 'hint: add the long-lived USER token as secret META_USER_TOKEN (rupload accepts only user tokens)'); throw lastErr; }
  // 3. wait until Instagram has processed the video
  if (!(await waitReady(c.id))) throw new Error('processing of the uploaded video failed');
  }
  // 4. publish
  const pub = await api('POST', `${G}/${IG}/media_publish`, new URLSearchParams({ creation_id: c.id, access_token: TOKEN }));
  let link = ''; try { link = (await api('GET', `${G}/${pub.id}?fields=permalink&access_token=${encodeURIComponent(TOKEN)}`)).permalink; } catch {}
  log('PUBLISHED', pub.id, link); if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `permalink=${link}\n`);
})().catch(e => { console.error('PUBLISH FAILED:', scrub(e.message)); process.exit(1); });
