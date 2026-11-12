// Gemini TTS test: node tools/gemini_tts.js <outDir> "<text>" [voice ...]
// Reads GEMINI_API_KEY from .env (never printed). Writes 24 kHz WAV files.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
function envKey(name) { if (process.env[name]) return process.env[name]; const f = path.join(ROOT, '.env'); if (!fs.existsSync(f)) return null;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && m[1] === name) return m[2].replace(/^["']|["']$/g, '').trim() || null; } return null; }
const KEY = envKey('GEMINI_API_KEY') || envKey('GOOGLE_API_KEY');
const [outDir, text, ...vs] = process.argv.slice(2); const voices = vs.length ? vs : ['Puck', 'Achird', 'Charon'];
const MODELS = (process.env.GEMINI_TTS_MODEL ? [process.env.GEMINI_TTS_MODEL] : []).concat(['gemini-2.5-flash-preview-tts', 'gemini-3.1-flash-tts-preview']);
const STYLE = 'Leé esto como un porteño de Buenos Aires de unos 30 años, cálido y entusiasta, con acento rioplatense bien marcado (sheísmo: "yo" suena "sho", "yerba" suena "sherba") y voseo natural. Ritmo ágil de reel de Instagram, con emoción y sonrisa en la voz:';
function wav(pcm, sr = 24000) { const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40); return Buffer.concat([h, pcm]); }
(async () => {
  if (!KEY) { console.log('NO_KEY: GEMINI_API_KEY is not set in .env'); process.exit(2); }
  console.log('key present: yes'); fs.mkdirSync(outDir, { recursive: true });
  for (const voice of voices) {
    let done = false;
    for (const model of MODELS) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text: STYLE + '\n' + text }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { console.log(voice, model, 'HTTP', r.status, (j.error && j.error.message || '').slice(0, 160)); continue; }
      const part = j.candidates?.[0]?.content?.parts?.find(p => p.inlineData); if (!part) { console.log(voice, model, 'no audio in response'); continue; }
      const sr = +((part.inlineData.mimeType || '').match(/rate=(\d+)/)?.[1] || 24000); const pcm = Buffer.from(part.inlineData.data, 'base64');
      const out = path.join(outDir, `gemini_${voice}.wav`); fs.writeFileSync(out, wav(pcm, sr)); console.log('wrote', out, (pcm.length / 2 / sr).toFixed(2) + 's', 'model', model); done = true; break;
    }
    if (!done) console.log(voice, 'failed');
  }
})();
