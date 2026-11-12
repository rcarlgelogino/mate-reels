// ElevenLabs TTS with character timestamps -> word timings (same shape as the Edge words: {w, t, d}).
// Config from .env in the project root (never commit or print it):
//   ELEVENLABS_API_KEY=...        (required)
//   ELEVENLABS_VOICE_ID=...       (required: an Argentine Spanish voice from your ElevenLabs voice library)
//   ELEVENLABS_MODEL=eleven_multilingual_v2   (optional)
//   ELEVENLABS_FORMAT=mp3_44100_128           (optional; mp3_44100_192 needs a Creator plan or higher)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');

function loadEnv() {
  const f = path.join(ROOT, '.env'); const env = {};
  if (fs.existsSync(f)) for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
  return { ...env, ...Object.fromEntries(Object.entries(process.env).filter(([k]) => k.startsWith('ELEVENLABS_'))) };
}
const ENV = loadEnv();
const available = () => !!(ENV.ELEVENLABS_API_KEY && ENV.ELEVENLABS_VOICE_ID);

// Emotion -> voice settings. Lower stability = more expressive; style = exaggeration; speed 0.7..1.2.
const EMO = {
  neutral:   { stability: 0.55, style: 0.20, speed: 1.08 },
  excited:   { stability: 0.30, style: 0.65, speed: 1.15 },
  surprised: { stability: 0.30, style: 0.60, speed: 1.12 },
  warm:      { stability: 0.50, style: 0.40, speed: 1.02 },
  nostalgic: { stability: 0.55, style: 0.45, speed: 0.97 },
  proud:     { stability: 0.40, style: 0.55, speed: 1.05 },
  tense:     { stability: 0.40, style: 0.50, speed: 1.05 },
  funny:     { stability: 0.30, style: 0.65, speed: 1.12 },
  sad:       { stability: 0.55, style: 0.45, speed: 0.95 },
  angry:     { stability: 0.35, style: 0.60, speed: 1.10 },
  love:      { stability: 0.50, style: 0.50, speed: 1.00 }
};
const settingsFor = sg => ({ similarity_boost: 0.8, use_speaker_boost: true, ...(EMO[sg.emo] || EMO.neutral), ...(sg.el || {}) });
const cacheKey = sg => JSON.stringify({ v: ENV.ELEVENLABS_VOICE_ID, m: ENV.ELEVENLABS_MODEL || 'eleven_multilingual_v2', s: settingsFor(sg) });

// chars + start/end times -> words; keeps trailing punctuation (caption chunking uses it), drops leading ¡¿ and quotes
function toWords(al) {
  const ch = al.characters, st = al.character_start_times_seconds, en = al.character_end_times_seconds; const words = []; let cur = null;
  for (let i = 0; i < ch.length; i++) {
    if (/\s/.test(ch[i])) { if (cur) { words.push(cur); cur = null; } continue; }
    if (!cur) cur = { w: '', t: st[i], end: en[i] }; cur.w += ch[i]; cur.end = en[i];
  }
  if (cur) words.push(cur);
  return words.map(x => ({ w: x.w.replace(/^[¡¿"'(«]+/, '').replace(/[:;"')»]+$/, ''), t: x.t, d: Math.max(0.05, x.end - x.t) })).filter(x => x.w.length);
}

async function tts(sg, prevText, nextText, file) {
  const fmt = ENV.ELEVENLABS_FORMAT || 'mp3_44100_128';
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(ENV.ELEVENLABS_VOICE_ID)}/with-timestamps?output_format=${fmt}`;
  const body = { text: sg.say || sg.text, model_id: ENV.ELEVENLABS_MODEL || 'eleven_multilingual_v2', voice_settings: settingsFor(sg), language_code: 'es' };
  if (prevText) body.previous_text = prevText; if (nextText) body.next_text = nextText;
  const r = await fetch(url, { method: 'POST', headers: { 'xi-api-key': ENV.ELEVENLABS_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) { const t = (await r.text()).slice(0, 200); const e = new Error(`ElevenLabs ${r.status}: ${t}`); e.status = r.status; throw e; }
  const j = await r.json(); const audio = Buffer.from(j.audio_base64, 'base64'); if (audio.length < 4000) throw new Error('short audio');
  const words = toWords(j.alignment || j.normalized_alignment); if (!words.length) throw new Error('no word timings');
  fs.writeFileSync(file, audio); return words;
}

async function listVoices() {
  const r = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': ENV.ELEVENLABS_API_KEY } });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return (await r.json()).voices.map(v => ({ id: v.voice_id, name: v.name, labels: v.labels, preview: v.preview_url }));
}
module.exports = { available, tts, cacheKey, listVoices, toWords, ENV };
