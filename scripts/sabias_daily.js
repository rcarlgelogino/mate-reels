// Daily "¿Sabías que…?" reels: Gemini writes two mate topics (one "lo recomendable es X y no Z", one "si estás tomando mate y pasa Z…"),
// scripts/sabias.js turns each into a shooting script, pipeline/build.js renders it with the Charon voice.
// usage (GitHub, daily-reels workflow): node scripts/sabias_daily.js --day 2026-11-26 --first 5   -> out/<day>/05_sabias_<id>.mp4/.txt/.jpg + sabias.out (names)
// Topics and the agents used are kept in rotation/sabias.json so nothing repeats for a while. QA never blocks.
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..'); const G = require('./gemini_text'); const SB = require('./sabias');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const day = arg('--day', new Date().toISOString().slice(0, 10)); let n = +arg('--first', 5); const OUT = path.join(ROOT, 'out', day); fs.mkdirSync(OUT, { recursive: true });
const LOG = path.join(ROOT, 'rotation', 'sabias.json'); let hist = []; try { hist = JSON.parse(fs.readFileSync(LOG, 'utf8')); } catch {}
const log = (...a) => console.log('[sabias]', ...a); const line = s => fs.appendFileSync(path.join(OUT, 'SUMMARY.md'), s + '\n');

const RULES = `Escribís dos guiones cortos para reels de Instagram de una cuenta argentina de mate (@todo.de.mate), en español rioplatense con voseo ("tomás", "cebás", "Seguime").
Formato "¿Sabías que…?" (como @el_planeta_curioso): una acción cotidiana del mate, después una alternativa o un evento absurdo, exagerado y MUY específico (con nombre propio real),
2 o 3 datos reales con números, y al final tres pérdidas. Todo es un chiste obvio: nadie lo haría, pero los números son ciertos.

Tipo 1 "recomendable": "¿Sabías que para <acción del mate> lo recomendable es <lo normal>" / "y no <algo absurdo y específico>?"
  Ejemplo: "¿Sabías que para cebar mate lo recomendable es agua," / "y no lava del volcán Kilauea?"
Tipo 2 "si": "¿Sabías que si estás tomando mate y <evento absurdo y específico>," / "ya no podés seguir tomando mate?"
  Ejemplo: "¿Sabías que si estás tomando mate y te cae una bomba atómica en la casa," / "ya no podés seguir tomando mate?"

Lo absurdo tiene que poder mostrarse con UNO de estos "agentes" (el escenario es una cocinita en un jardín):
  lava (un volcán detrás de la casa con un río de lava; el termo puede volverse de lava), cisterna (un camión cisterna gigante de agua que se estaciona en la ventana),
  bomba (una bomba atómica que cae del cielo y un hongo), meteorito (un meteorito en llamas que cae al lado de la casa), tsunami (una ola gigante que llega), tornado (un tornado que se acerca).
  Elegí una versión real y con nombre: "el volcán Kilauea", "el meteorito de Campo del Cielo", "el tornado de Moore de 2013", "un camión cisterna de treinta mil litros", etc.
Datos ("facts"): 2 o 3, cada uno es UNA frase corta del guion con UN número real, conocido, redondeado y fácil de comprobar (fuente reconocida: USGS, NASA, NOAA, enciclopedias).
  Si no estás seguro de un número, usá otro dato que sí sepas. Podés comparar con el mate (agua a 75 grados, termo de un litro, unos 50 ml por cebada).
  show: "gauge" (aguja para temperaturas o velocidades, value = número), "counter" (número grande que corre, value = número, unit corta como "t", "km/h", "L"), "label" (cartel corto en mayúsculas, label <= 22 letras).
  En "text" los números van ESCRITOS EN PALABRAS ("mil ciento cincuenta grados"), porque lo lee una voz.
Pérdidas ("losses"): exactamente 3 palabras, en este orden: 1) lo que hay en el mate (yerba, agua, mate), 2) bombilla, 3) algo grande (cocina, casa, barrio, lengua, ciudad, vereda…).
  lossLine: tipo 1 "Lo más probable es que te quedes sin X, sin bombilla y sin Z." / tipo 2 "Porque te quedás sin X, sin bombilla y sin Z."
caption: 1-2 líneas con la pregunta, 1-2 emojis, y "Seguime para más datos de mate."
No repitas estos temas recientes: `;

async function author() {
  const recent = hist.slice(-20).map(h => `${h.agent}: ${h.absurd}`).join(' | ') || '(ninguno)';
  const usedAgents = hist.slice(-4).map(h => h.agent);
  const prompt = RULES + recent + `\nNo uses estos agentes hoy: ${usedAgents.join(', ') || '(ninguno)'}. Los dos temas de hoy usan agentes distintos.
Respondé SOLO con JSON: {"topics":[{"kind":"recomendable","id":"<slug corto sin acentos>","hook":"…","absurd":"…","agent":"…","agentLabel":"<CARTEL EN MAYÚSCULAS <= 22>","normalLabel":"<cartel de lo normal, ej. AGUA · 75 °C>","facts":[{"text":"…","show":"…","value":0,"unit":"","label":"","source":"…"}],"losses":["…","bombilla","…"],"lossLine":"…","caption":"…","thumb":["<línea 1>","<línea 2>"]},{"kind":"si", …}]}`;
  for (let a = 1; a <= 3; a++) {
    try { const r = await G.generate([{ text: prompt }], { temperature: 0.9 }); const ts = (r.data && r.data.topics) || [];
      const ok = ts.filter(t => SB.check(t).length === 0); log('gemini', r.model, ts.length, 'topics,', ok.length, 'valid', ts.map(t => SB.check(t).join('/')).join(' | '));
      if (ok.length >= 2) return ok.slice(0, 2); } catch (e) { log('gemini failed', a, e.message.slice(0, 160)); } }
  return []; }

(async () => {
  if (!G.hasKey()) { log('no GEMINI_API_KEY: no ¿Sabías que? reels today'); process.exit(0); }
  const topics = await author(); if (!topics.length) { line('- ❌ ¿Sabías que?: no valid topics from Gemini'); process.exit(0); }
  const names = [];
  for (const T of topics) {
    T.id = (T.id || 'tema').toLowerCase().replace(/[^a-z0-9_]+/g, '_').slice(0, 40); const name = `sabias_${T.id}`; const work = path.join(ROOT, 'work', name); fs.mkdirSync(work, { recursive: true });
    fs.writeFileSync(path.join(work, 'topic.json'), JSON.stringify(T, null, 1)); fs.writeFileSync(path.join(work, 'script.json'), JSON.stringify(SB.toScript(T), null, 1));
    let r = spawnSync(process.execPath, [path.join(ROOT, 'scripts/make.js'), path.join(work, 'script.json'), work, '--style', 'build3d'], { stdio: 'inherit' });
    if (r.status === 0) r = spawnSync(process.execPath, [path.join(ROOT, 'pipeline/build.js'), path.join(work, 'spec.json')], { stdio: 'inherit', timeout: 150 * 60 * 1000 });
    const mp4 = path.join(work, 'final.mp4'); if (r.status !== 0 || !fs.existsSync(mp4)) { line(`- ❌ ¿Sabías que? ${T.id}: build failed`); continue; }
    const out = `${String(n++).padStart(2, '0')}_${name}`; fs.copyFileSync(mp4, path.join(OUT, out + '.mp4'));
    if (fs.existsSync(path.join(work, 'caption.txt'))) fs.copyFileSync(path.join(work, 'caption.txt'), path.join(OUT, out + '.txt'));
    else fs.writeFileSync(path.join(OUT, out + '.txt'), (T.caption || '') + '\n\n' + (T.hashtags || ['#mate', '#datoscuriosos', '#argentina', '#humor', '#sabiasque']).join(' ') + '\n');
    for (const c of ['cover.jpg', 'thumb.jpg']) if (fs.existsSync(path.join(work, c))) { fs.copyFileSync(path.join(work, c), path.join(OUT, out + '.jpg')); break; }
    const dir = path.join(ROOT, 'done', day); fs.mkdirSync(dir, { recursive: true }); fs.copyFileSync(path.join(work, 'topic.json'), path.join(dir, name + '.topic.json'));
    hist.push({ day, kind: T.kind, agent: T.agent, absurd: T.absurd, id: T.id }); names.push(out); line(`- ✅ ¿Sabías que? (${T.kind}, ${T.agent}): ${T.hook} ${T.absurd}`); }
  fs.mkdirSync(path.dirname(LOG), { recursive: true }); fs.writeFileSync(LOG, JSON.stringify(hist, null, 1)); fs.writeFileSync(path.join(OUT, 'sabias.out'), names.join('\n') + '\n'); log('built', names.join(', '));
})().catch(e => { console.error(e); process.exit(1); });
