// One command per video:  node pipeline/build.js <path/to/spec.json> [--sheet-only]
// spec -> narration (Edge TTS, word timings) -> timeline -> headless render -> sfx + music -> final.mp4 (+ sheet.png, caption.txt)
const fs = require('fs'), path = require('path'), http = require('http'), crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const TOOLS = path.join(ROOT, 'tools', 'node_modules');
const FF = require(path.join(TOOLS, 'ffmpeg-static'));
const FP = require(path.join(TOOLS, 'ffprobe-static')).path;
const puppeteer = require(path.join(TOOLS, 'puppeteer'));
const { MsEdgeTTS, OUTPUT_FORMAT } = require(path.join(TOOLS, 'msedge-tts'));
const { make } = require('./audio');
const EL = require('./eleven'); const GEM = require('./gemini');

const specPath = path.resolve(process.argv[2] || ''); if (!fs.existsSync(specPath)) { console.error('usage: node pipeline/build.js <spec.json>'); process.exit(2); }
const SHEET_ONLY = process.argv.includes('--sheet-only');
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8')); const OUT = path.dirname(specPath);
const log = (...a) => { const l = `[${new Date().toISOString().slice(11, 19)}] ${a.join(' ')}`; console.log(l); fs.appendFileSync(path.join(OUT, 'build.log'), l + '\n'); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- 1. narration ----------
async function ttsOnce(text, voice, rate, file, pitch) {
  const tts = new MsEdgeTTS(); await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, { wordBoundaryEnabled: true });
  const { audioStream, metadataStream } = tts.toStream(text, pitch ? { rate, pitch } : { rate }); const chunks = [], meta = [];
  if (metadataStream) metadataStream.on('data', c => meta.push(c.toString()));
  await new Promise((res, rej) => { audioStream.on('data', c => chunks.push(c)); audioStream.on('end', res); audioStream.on('close', res); audioStream.on('error', rej); });
  await sleep(200); try { tts.close(); } catch {}
  const b = Buffer.concat(chunks); if (b.length < 4000) throw new Error('short audio');
  const words = []; for (const m of meta) for (const part of m.split(/(?<=\})\s*(?=\{"Metadata")/)) { try { for (const x of JSON.parse(part).Metadata) if (x.Type === 'WordBoundary') words.push({ w: x.Data.text.Text, t: x.Data.Offset / 1e7, d: x.Data.Duration / 1e7 }); } catch {} }
  if (!words.length) throw new Error('no word timings');
  fs.writeFileSync(file, b); return words;
}
// Emotional delivery per segment: "emo" picks rate/pitch offsets on top of the base rate; "voice": {rate, pitch} overrides.
// pitch offsets kept small (max ~10 Hz): larger shifts make the free Edge voice sound artificial (user: "Stimme ist low quality", 2026-11-11)
const EMO = { neutral: [0, 0], excited: [8, 6], surprised: [4, 10], warm: [-5, -3], nostalgic: [-9, -5], proud: [-2, 3], tense: [-4, -6], funny: [6, 7], sad: [-10, -8], love: [-5, 2] };
function pct(r, d) { const n = parseFloat(String(r).replace('%', '')) || 0; const v = n + d; return (v >= 0 ? '+' : '') + v + '%'; }
function prosody(sg, base) { if (sg.voice && (sg.voice.rate || sg.voice.pitch)) return { rate: sg.voice.rate || base, pitch: sg.voice.pitch || null };
  const e = EMO[sg.emo]; if (!e) return { rate: base, pitch: null }; return { rate: pct(base, e[0]), pitch: (e[1] >= 0 ? '+' : '') + e[1] + 'Hz' }; }
// provider: ElevenLabs when .env has ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID (unless spec.tts === 'edge'); Edge stays as automatic fallback
// Gemini (voice Charon) whenever GEMINI_API_KEY is set, unless spec.tts says otherwise; ElevenLabs next; Edge as the fallback
let PROVIDER = spec.tts === 'edge' ? 'edge' : (GEM.available() && spec.tts !== 'elevenlabs') ? 'gemini' : EL.available() ? 'elevenlabs' : 'edge';
async function narration() {
  const voice = spec.voice || 'en-US-AndrewNeural', rate = spec.rate || '+14%'; const dir = path.join(OUT, 'vo'); fs.mkdirSync(dir, { recursive: true });
  log('tts provider', PROVIDER);
  if (PROVIDER === 'gemini') { try { return await GEM.narrate(spec, dir, log); } catch (e) { log('WARN Gemini unavailable (' + e.message.slice(0, 160) + '), falling back to Edge TTS'); PROVIDER = 'edge'; log('tts provider', PROVIDER); } }
  const res = [];
  for (let i = 0; i < spec.segments.length; i++) {
    const sg = spec.segments[i]; const text = sg.say || sg.text; const pr = prosody(sg, rate);
    if (PROVIDER === 'elevenlabs') {
      const h = crypto.createHash('md5').update('el' + EL.cacheKey(sg) + text).digest('hex').slice(0, 10);
      const file = path.join(dir, `vo_${i + 1}_el_${h}.mp3`), wfile = file.replace('.mp3', '.json');
      if (fs.existsSync(file) && fs.existsSync(wfile)) { res.push({ file, words: JSON.parse(fs.readFileSync(wfile, 'utf8')) }); continue; }
      let words = null, last; const prev = i > 0 ? (spec.segments[i - 1].say || spec.segments[i - 1].text) : null, next = spec.segments[i + 1] ? (spec.segments[i + 1].say || spec.segments[i + 1].text) : null;
      for (let a = 1; a <= 4 && !words; a++) { try { words = await EL.tts(sg, prev, next, file); } catch (e) { last = e; log('elevenlabs retry', i + 1, a, e.message.slice(0, 120)); if (e.status === 401 || e.status === 402 || e.status === 403) break; await sleep(1500 * a); } }
      if (words) { fs.writeFileSync(wfile, JSON.stringify(words)); res.push({ file, words }); continue; }
      if (i > 0) throw new Error('ElevenLabs failed mid-reel (' + (last && last.message) + '). Rerun; cached segments are kept.');
      log('WARN ElevenLabs unavailable (' + (last && last.message.slice(0, 80)) + '), falling back to Edge TTS for this reel'); PROVIDER = 'edge'; log('tts provider', PROVIDER);
    }
    const h = crypto.createHash('md5').update(voice + pr.rate + (pr.pitch || '') + text).digest('hex').slice(0, 10);
    const file = path.join(dir, `vo_${i + 1}_${h}.mp3`), wfile = file.replace('.mp3', '.json');
    if (fs.existsSync(file) && fs.existsSync(wfile)) { res.push({ file, words: JSON.parse(fs.readFileSync(wfile, 'utf8')) }); continue; }
    let words = null, last;
    for (let a = 1; a <= 8 && !words; a++) { try { words = await ttsOnce(text, voice, a > 4 ? pct(pr.rate, -2) : pr.rate, file, a > 6 ? null : pr.pitch); } catch (e) { last = e; log('tts retry', i + 1, a, e.message.slice(0, 60)); await sleep(1200 * a); } }
    if (!words) throw new Error(`TTS failed for segment ${i + 1}: ${last && last.message}. Shorten the sentence.`);
    // show the written form in captions (spec.segments[i].text) when 'say' differs: map words 1:1 if counts match
    if (spec.segments[i].say) { const disp = spec.segments[i].text.split(/\s+/); if (disp.length === words.length) words.forEach((w, k) => w.w = disp[k]); }
    fs.writeFileSync(wfile, JSON.stringify(words)); res.push({ file, words });
  }
  return res;
}

// ---------- 2. timeline ----------
function plan(vo) {
  const tl = { fps: 30, shots: [], words: [], callouts: [], cuts: [], voice: [], cues: [], events: { flash: [], shake: [] }, style: spec.style || {}, voiceProvider: PROVIDER };
  const segs = spec.segments; let T = 0;
  const wordAt = (si, re, base) => { if (re == null) return null; const rx = new RegExp(re, 'i'); const w = vo[si].words.find(x => rx.test(x.w.replace(/[.,!?]$/, ''))); if (!w) throw new Error(`segment ${si + 1}: word /${re}/ not found in "${segs[si].text}"`); return base + w.t; };
  segs.forEach((sg, si) => {
    const ws = vo[si].words, last = ws[ws.length - 1], lead = si === 0 ? 0.05 : 0.06, tail = si === segs.length - 1 ? 0.6 : (sg.tail ?? 0.2);
    const len = lead + last.t + last.d + tail, base = T + lead;
    tl.voice.push({ file: path.relative(ROOT, vo[si].file).replace(/\\/g, '/'), at: +base.toFixed(3) });
    ws.forEach(w => tl.words.push({ w: w.w, t: +(base + w.t).toFixed(3), d: w.d, seg: si }));
    const fsum = sg.shots.reduce((a, s) => a + (s.f || 1), 0); let st = T;
    sg.shots.forEach((sh, k) => { const d = len * (sh.f || 1) / fsum; tl.shots.push({ tpl: sh.tpl, p: sh.p || {}, zoom: sh.zoom || 1, c: sh.c || [0.5, 0.5], tOffset: sh.tOffset || 0, start: +st.toFixed(3), dur: +d.toFixed(3), seg: si, emo: sh.emo || null, segEmo: sg.emo || null });
      if (k > 0) tl.cues.push({ type: 'snap', t: st }); st += d; });
    if (si > 0) { tl.cuts.push(+T.toFixed(3)); tl.cues.push({ type: 'whoosh', t: T - 0.28 }, { type: 'hit', t: T }); } else tl.cues.push({ type: 'hit', t: 0 });
    const segEnd = T + len;
    (sg.callouts || []).forEach((c, ci) => {
      const t0 = c.at != null ? wordAt(si, c.at, base) + (c.offset || 0) : T + 0.15;
      const nextC = (sg.callouts || [])[ci + 1]; let t1 = c.until ? wordAt(si, c.until, base) : (nextC && nextC.at != null && !c.keep ? wordAt(si, nextC.at, base) - 0.04 : segEnd);
      const o = { ...c, t0: +t0.toFixed(3), t1: +t1.toFixed(3) };
      if (c.type === 'counter') { const c1 = c.countTo ? wordAt(si, c.countTo, base) : t0 + 1.1; o.count = [t0, c1]; for (let t = t0; t < c1; t += 0.055) tl.cues.push({ type: 'tick', t }); tl.cues.push({ type: 'ding', t: c1 }); }
      if (c.type === 'ratio') o.tb = c.atB ? wordAt(si, c.atB, base) : t0 + 0.8;
      tl.callouts.push(o); tl.cues.push({ type: c.type === 'check' ? 'ding' : c.type === 'cross' ? 'buzz' : 'pop', t: t0 });
      if (c.impact) { tl.events.flash.push(t0 + 0.02); tl.events.shake.push(t0 + 0.02); tl.cues.push({ type: 'boomSoft', t: t0 }); }
    });
    (sg.cues || []).forEach(c => tl.cues.push({ ...c, t: c.at != null ? wordAt(si, c.at, base) : T + (c.t || 0) }));
    T += len;
  });
  tl.total = +T.toFixed(3);
  if (spec.follow !== false) { const si = segs.length - 1; let t0; try { t0 = wordAt(si, '^follow', T - 0) ; t0 = tl.words.find(w => w.seg === si && /^follow/i.test(w.w))?.t ?? (T - 1.8); } catch { t0 = T - 1.8; }
    tl.callouts.forEach(c => { if (c.t1 > t0) c.t1 = Math.max(c.t0 + 0.3, t0 - 0.04); });
    if (spec.followText !== false) tl.callouts.push({ type: 'pill', text: spec.followText || 'FOLLOW FOR MORE', sub: spec.followSub || 'STORIES ABOUT MATE', t0, t1: T + 1, y: spec.followY }); tl.cues.push({ type: 'popBig', t: t0 }); }
  return tl;
}

// ---------- 3. render ----------
function serve() { return new Promise(res => { const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };
  const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(ROOT)) { r.writeHead(403); return r.end(); }
    fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); });
  srv.listen(0, '127.0.0.1', () => res(srv)); }); }
async function render(tl) {
  const srv = await serve(); const port = srv.address().port;
  const browser = await puppeteer.launch({ headless: true, protocolTimeout: 600000, args: (process.platform === 'win32' && !process.env.SWIFTSHADER ? ['--use-angle=d3d11', '--enable-gpu'] : ['--use-angle=swiftshader', '--use-gl=angle', '--no-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas']).concat(['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--window-size=1200,2000']) });
  try {
    const page = await browser.newPage(); page.on('pageerror', e => log('pageerror', e.message)); page.on('console', m => { if (m.type() === 'error') log('console', m.text()); });
    await page.goto(`http://127.0.0.1:${port}/engine/index.html`, { waitUntil: 'load' }); await page.waitForFunction('window.__engineReady===true', { timeout: 60000 });
    const gpu = await page.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const d = g.getExtension('WEBGL_debug_renderer_info'); return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown'; }); log('gpu', gpu);
    const info = await page.evaluate(t => window.__engine.init(t), tl);
    const mids = tl.shots.map(s => +(s.start + s.dur * 0.6).toFixed(3));
    const sheet = await page.evaluate(ts => window.__engine.sheet(ts, 5), mids); fs.writeFileSync(path.join(OUT, 'sheet.png'), Buffer.from(sheet.split(',')[1], 'base64'));
    if (SHEET_ONLY) return info;
    const n = Math.ceil(tl.total * tl.fps); const video = path.join(OUT, 'video.mp4');
    const ff = spawn(FF, ['-y', '-v', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(tl.fps), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', video], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let f = 0; f < n; f++) { const d = await page.evaluate(t => window.__engine.jpeg(t, 0.93), f / tl.fps); const b = Buffer.from(d.split(',')[1], 'base64');
      if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r)); if (f % 90 === 0) log(`frame ${f}/${n} ${((Date.now() - t0) / 1000).toFixed(0)}s`); }
    ff.stdin.end(); await new Promise((r, j) => ff.on('close', c => c === 0 ? r() : j(new Error('ffmpeg video exit ' + c))));
    log(`render done ${n} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`); return info;
  } finally { try { await browser.close(); } catch (e) { log('WARN browser close', e.message.slice(0, 100)); } srv.close(); }
}

// ---------- 4. audio + mux ----------
function mix(tl, cues) {
  const A = make(tl.total); const sfxF = path.join(OUT, 'sfx.wav'), musF = path.join(OUT, 'music.wav');
  A.writeWav(sfxF, A.sfx([...tl.cues, ...cues].sort((a, b) => a.t - b.t))); A.writeWav(musF, A.music(tl.style));
  const args = ['-y', '-v', 'error', '-i', path.join(OUT, 'video.mp4')]; tl.voice.forEach(v => args.push('-i', path.join(ROOT, v.file))); args.push('-i', musF, '-i', sfxF);
  const nv = tl.voice.length, mi = nv + 1, si = nv + 2;
  let fc = tl.voice.map((v, k) => `[${k + 1}]aresample=48000:filter_size=64,aformat=channel_layouts=stereo,adelay=${Math.round(v.at * 1000)}:all=1[v${k}]`).join(';');
  fc += `;${tl.voice.map((_, k) => `[v${k}]`).join('')}amix=inputs=${nv}:normalize=0,${tl.voiceProvider !== 'edge' ? 'highpass=f=70,deesser=i=0.3,acompressor=threshold=-20dB:ratio=2.5:attack=20:release=150:makeup=1.5' : 'highpass=f=80,equalizer=f=250:t=q:w=1:g=-2.5,equalizer=f=3200:t=q:w=1.2:g=3,aexciter=amount=1.2:drive=6:freq=5500:blend=0,deesser=i=0.4,acompressor=threshold=-20dB:ratio=3:attack=15:release=120:makeup=1.6'},volume=${tl.style.voiceGain ?? 1.8},asplit=2[vo][sc]`;
  // voice clearly on top (user feedback 2026-11-11: "Stimme muss viel lauter"): boosted + compressed voice, quieter bed and sfx, louder master
  fc += `;[${mi}]volume=${tl.style.musicVol ?? 0.12}[mus];[mus][sc]sidechaincompress=threshold=0.02:ratio=12:attack=10:release=300[duck];[${si}]volume=${tl.style.sfxVol ?? 0.35}[fx]`;
  fc += `;[vo][duck][fx]amix=inputs=3:normalize=0:duration=longest,loudnorm=I=-12:TP=-1.0:LRA=7,aresample=48000[a]`;
  const out = path.join(OUT, 'final.mp4');
  args.push('-filter_complex', fc, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', String(tl.total), '-movflags', '+faststart', out);
  execFileSync(FF, args, { stdio: 'inherit' });
  const dur = execFileSync(FP, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString().trim();
  const ebur = (() => { try { const r = require('child_process').spawnSync(FF, ['-v', 'info', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' }); const m = /I:\s+(-?[\d.]+) LUFS[\s\S]*Peak:\s+(-?[\d.]+)/.exec(r.stderr.split('Summary')[1] || ''); return m ? `${m[1]} LUFS, peak ${m[2]} dBFS` : '?'; } catch { return '?'; } })();
  return { out, dur, ebur };
}

(async () => {
  const t0 = Date.now(); fs.writeFileSync(path.join(OUT, 'build.log'), '');
  log('spec', spec.id); const vo = await narration(); log('narration ok', vo.map(v => v.words.length).join('/'));
  const tl = plan(vo); fs.writeFileSync(path.join(OUT, 'timeline.json'), JSON.stringify(tl, null, 1)); log('timeline', tl.total + 's', tl.shots.length, 'shots');
  const info = await render(tl); if (SHEET_ONLY) { log('sheet only'); process.exit(0); }
  const r = mix(tl, info.cues);
  const cap = [spec.caption || '', '', (spec.hashtags || []).join(' ')].join('\n').trim(); fs.writeFileSync(path.join(OUT, 'caption.txt'), cap + '\n');
  fs.rmSync(path.join(OUT, 'video.mp4'), { force: true });
  const tgt = spec.target || [35, 45];
  const result = { id: spec.id, file: path.relative(ROOT, r.out), voice: tl.voiceProvider, duration: +r.dur, inTarget: +r.dur >= tgt[0] && +r.dur <= tgt[1], target: tgt, loudness: r.ebur, shots: tl.shots.length, minutes: +((Date.now() - t0) / 60000).toFixed(1) };
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify(result, null, 1)); log('DONE', JSON.stringify(result));
  process.exit(0);
})().catch(e => { log('FAILED', e.stack || e.message); process.exit(1); });
