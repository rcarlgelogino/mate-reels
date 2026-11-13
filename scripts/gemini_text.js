// Shared Gemini helper for text/vision calls (free tier). Picks the newest available Flash model automatically,
// so a renamed or retired model never breaks the pipeline. Key: GEMINI_API_KEY (env or .env, never printed).
const fs = require('fs'), path = require('path'); const ROOT = path.join(__dirname, '..');
function envKey(name) { if (process.env[name]) return process.env[name]; const f = path.join(ROOT, '.env'); if (!fs.existsSync(f)) return null;
  for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && m[1] === name) return m[2].replace(/^["']|["']$/g, '').trim() || null; } return null; }
const KEY = () => envKey('GEMINI_API_KEY') || envKey('GOOGLE_API_KEY');
const BASE = 'https://generativelanguage.googleapis.com/v1beta';
let cache = null;
async function models() {
  if (cache) return cache; const k = KEY(); if (!k) return [];
  const out = []; let tok = '';
  for (let p = 0; p < 5; p++) { const r = await fetch(`${BASE}/models?pageSize=200${tok ? '&pageToken=' + tok : ''}`, { headers: { 'x-goog-api-key': k } }); const j = await r.json().catch(() => ({}));
    (j.models || []).forEach(m => out.push(m)); if (!j.nextPageToken) break; tok = j.nextPageToken; }
  const ver = n => { const m = n.match(/gemini-(\d+(?:\.\d+)?)/); return m ? parseFloat(m[1]) : 0; };
  const ok = out.filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map(m => m.name.replace(/^models\//, ''))
    .filter(n => /flash/.test(n) && !/tts|image|live|audio|embed|vision-|thinking-exp|robotics|computer-use/.test(n));
  // newest version first; within a version prefer stable over preview/exp, full flash over lite
  ok.sort((a, b) => ver(b) - ver(a) || (/preview|exp/.test(a) - /preview|exp/.test(b)) || (/lite/.test(a) - /lite/.test(b)));
  cache = ok; return ok;
}
// parts: [{text}] or [{inline_data:{mime_type,data}}]; returns parsed JSON (json=true) or text; throws when no model answers
async function generate(parts, { json = true, temperature = 0.3, prefer = process.env.GEMINI_QA_MODEL } = {}) {
  const k = KEY(); if (!k) throw new Error('no GEMINI_API_KEY');
  const list = [prefer, ...(await models())].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).slice(0, 6); let last = 'no model available';
  for (const model of list) {
    const r = await fetch(`${BASE}/models/${model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': k },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature, ...(json ? { responseMimeType: 'application/json' } : {}) } }) });
    const j = await r.json().catch(() => ({})); if (!r.ok) { last = `${model} ${r.status} ${(j.error && j.error.message || '').slice(0, 120)}`; continue; }
    const txt = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
    if (!json) return { model, text: txt };
    try { return { model, data: JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)) }; } catch (e) { last = `${model} returned no valid JSON`; }
  }
  throw new Error(last);
}
module.exports = { generate, models, hasKey: () => !!KEY() };
