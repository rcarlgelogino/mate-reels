// Gemini TTS provider: speaks the whole reel in ONE request (voice Charon by default), aligns words with local Whisper,
// then cuts the take into one WAV per segment with word timings relative to each file. Key: GEMINI_API_KEY (env or .env, never printed).
const fs = require('fs'), path = require('path'), crypto = require('crypto'); const { execFileSync, spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..'), TOOLS = path.join(ROOT, 'tools', 'node_modules'); const FF = require(path.join(TOOLS, 'ffmpeg-static'));
function envKey(name) { if (process.env[name]) return process.env[name]; const f = path.join(ROOT, '.env'); if (!fs.existsSync(f)) return null;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && m[1] === name) return m[2].replace(/^["']|["']$/g, '').trim() || null; } return null; }
const KEY = () => envKey('GEMINI_API_KEY') || envKey('GOOGLE_API_KEY');
const MODELS = () => (envKey('GEMINI_TTS_MODEL') ? [envKey('GEMINI_TTS_MODEL')] : []).concat(['gemini-2.5-flash-preview-tts', 'gemini-3.1-flash-tts-preview']);
const STYLE = 'Leé este guion de un reel de Instagram como un porteño de Buenos Aires de unos 30 años: cálido, cercano y entusiasta, con acento rioplatense bien marcado (sheísmo: "yo" suena "sho", "yerba" suena "sherba", "lleva" suena "sheva") y voseo natural. Ritmo ágil y con energía, como contándole algo fascinante a un amigo; cambiá la emoción según cada frase (sorpresa en las preguntas, orgullo y cariño en el final). Una pausa corta entre líneas. No agregues ni cambies palabras:';
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]/g, '');
function lev(a, b) { const m = a.length, n = b.length; if (!m || !n) return Math.max(m, n); const d = Array.from({ length: m + 1 }, (_, i) => [i]); for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }
const sim = (a, b) => { a = norm(a); b = norm(b); if (!a || !b) return 0; return 1 - lev(a, b) / Math.max(a.length, b.length); };
function wav(pcm, sr) { const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40); return Buffer.concat([h, pcm]); }
async function speak(text, voice, file, log) {
  // Gemini TTS (preview) often fails for a few minutes: several rounds over all models with growing pauses (about 7 minutes in total)
  let last; const waits = [0, 45000, 90000, 150000, 150000];
  for (let round = 0; round < waits.length; round++) { if (waits[round]) { log('gemini: all models failed, next round in', waits[round] / 1000, 's'); await new Promise(q => setTimeout(q, waits[round])); }
  for (const model of MODELS()) for (let a = 1; a <= 3; a++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY() },
      body: JSON.stringify({ contents: [{ parts: [{ text: STYLE + '\n\n' + text }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } }) });
    const j = await r.json().catch(() => ({})); if (!r.ok) { last = `HTTP ${r.status} ${(j.error && j.error.message || '').slice(0, 140)}`; log('gemini', model, 'attempt', a, last); if (r.status === 429 && /per.?day|PerDay|daily/i.test(last)) break; // daily quota (10/day on the free tier) is gone: fall back to Edge
      if (r.status === 429 || r.status >= 500) { await new Promise(q => setTimeout(q, (r.status === 429 ? 25000 : 4000) * a)); continue; } break; }
    const part = j.candidates?.[0]?.content?.parts?.find(p => p.inlineData); if (!part) { last = 'no audio'; continue; }
    const sr = +((part.inlineData.mimeType || '').match(/rate=(\d+)/)?.[1] || 24000); fs.writeFileSync(file, wav(Buffer.from(part.inlineData.data, 'base64'), sr)); return model; }
  if (/per.?day|PerDay|daily/i.test(last || '') || /^HTTP 4(0[0-9]|1[0-9])/.test(last || '')) break; } // daily quota used up or a permanent error (bad key, bad request): waiting does not help
  throw new Error('Gemini TTS failed: ' + last); }
function align(file, log) { const f32 = file.replace(/\.wav$/, '.f32'); execFileSync(FF, ['-y', '-v', 'error', '-i', file, '-ac', '1', '-ar', '16000', '-f', 'f32le', f32]);
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'align.mjs'), f32, 'spanish'], { cwd: path.join(ROOT, 'tools'), encoding: 'utf8', maxBuffer: 1 << 26, timeout: 15 * 60 * 1000 });
  try { fs.unlinkSync(f32); } catch {} if (r.status !== 0) throw new Error('whisper alignment failed: ' + (r.stderr || '').slice(-300)); const s = r.stdout; return JSON.parse(s.slice(s.indexOf('['))); }
// map script words onto whisper words (times only), interpolating any word whisper missed
function mapWords(script, heard) { const out = script.map(w => ({ w, t: null, e: null })); let j = 0;
  for (let i = 0; i < out.length && j < heard.length; i++) { let best = -1, bs = 0.45; for (let k = j; k < Math.min(heard.length, j + 4); k++) { const sc = sim(out[i].w, heard[k].w) - (k - j) * 0.05; if (sc > bs) { bs = sc; best = k; } }
    if (best >= 0) { out[i].t = heard[best].t; out[i].e = heard[best].e; j = best + 1; } }
  for (let i = 0; i < out.length; i++) if (out[i].t == null) { let a = i - 1; while (a >= 0 && out[a].t == null) a--; let b = i + 1; while (b < out.length && out[b].t == null) b++;
    const t0 = a >= 0 ? out[a].e : 0, t1 = b < out.length ? out[b].t : t0 + 0.4 * (b - a); const n = b - a; for (let k = a + 1; k < b; k++) { out[k].t = t0 + (t1 - t0) * (k - a - 1) / Math.max(1, n - 1); out[k].e = out[k].t + Math.max(0.12, (t1 - t0) / Math.max(1, n - 1)); } i = b; }
  return out; }
module.exports = {
  available: () => !!KEY(),
  async narrate(spec, dir, log) {
    const voice = spec.geminiVoice || 'Charon'; const lines = spec.segments.map(sg => (sg.say || sg.text).trim()); const full = lines.join('\n');
    const h = crypto.createHash('md5').update(voice + STYLE + full).digest('hex').slice(0, 10); const take = path.join(dir, `gem_${h}.wav`), mf = path.join(dir, `gem_${h}.json`);
    let meta = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, 'utf8')) : null;
    if (!meta) { const model = await speak(full, voice, take, log); log('gemini take', model, voice); const heard = align(take, log); log('whisper words', heard.length);
      const script = []; spec.segments.forEach((sg, si) => sg.text.split(/\s+/).filter(Boolean).forEach(w => script.push({ w, si })));
      const mapped = mapWords(script.map(x => x.w), heard).map((m, k) => ({ ...m, si: script[k].si })); meta = { model, voice, words: mapped }; fs.writeFileSync(mf, JSON.stringify(meta)); }
    const total = +execFileSync(require(path.join(TOOLS, 'ffprobe-static')).path, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', take]).toString().trim();
    const res = []; const segW = spec.segments.map((_, si) => meta.words.filter(w => w.si === si));
    segW.forEach((ws, si) => { const prevEnd = si ? segW[si - 1][segW[si - 1].length - 1].e : 0, nextStart = si < segW.length - 1 ? segW[si + 1][0].t : total;
      const a = Math.max(prevEnd + 0.01, ws[0].t - 0.07), b = Math.min(nextStart - 0.01, ws[ws.length - 1].e + 0.16); const file = path.join(dir, `vo_${si + 1}_gem_${h}.wav`);
      if (!fs.existsSync(file)) execFileSync(FF, ['-y', '-v', 'error', '-ss', a.toFixed(3), '-t', (b - a).toFixed(3), '-i', take, '-af', 'afade=t=in:d=0.015,areverse,afade=t=in:d=0.03,areverse', file]);
      res.push({ file, words: ws.map(w => ({ w: w.w, t: +(w.t - a).toFixed(3), d: +Math.max(0.08, w.e - w.t).toFixed(3) })) }); });
    return res; } };
