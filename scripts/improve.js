// Uses the VISUAL learnings of earlier reels (qa/learnings.json) to choose better pictures for the next script,
// right before it is built. usage: node scripts/improve.js <queue script.json> <out.json>
// Only the "visual"/"visuals" of each segment may change (place, people, roles, does, mood, pass, objects, labels).
// Spoken text, headlines, timing, emotions, beats, caption, hashtags and poll are locked: pacing, hook and wording
// are not learned by the AI. A validator checks the result; if anything is off, nothing is written and the original
// script is built as it is. Never blocks: exit code is always 0. Writes <out.json> and <out>.changes.json.
const fs = require('fs'), path = require('path'); const G = require('./gemini_text');
const ROOT = path.join(__dirname, '..'); const [src, dst] = process.argv.slice(2).map(p => p && path.resolve(p));
const log = (...a) => console.log('[improve]', ...a);
const VIS = { scene: 1, reaction: 1, object: 1, title: 1, list: 1, checklist: 1, number: 1, dots: 1, timeline: 1, mistake: 1 };
const ROLES = 'cebador friend grandma grandpa stranger kid worker you'.split(' ');
const DOES = 'idle hold_mate hold_termo hold_both drink pass receive wave point hug cheer jump no nod shock laugh sigh'.split(' ');
const MOODS = 'happy smile surprised sad angry love laugh proud neutral'.split(' ');
const PLACES = 'kitchen park plaza patio beach home'.split(' ');
const ITEMS = 'mate mate_madera imperial termo yerba bombilla'.split(' ');
const vis = g => g.visuals || (g.visual ? [g.visual] : []);
const rest = g => { const o = { ...g }; delete o.visual; delete o.visuals; return JSON.stringify(o); };
const texts = v => JSON.stringify([v.text, v.sub, v.value, v.items, v.rows, v.label, v.labels]);
function validate(orig, s) {
  const e = []; if (!s || !Array.isArray(s.segments)) return ['no segments'];
  if (s.segments.length !== orig.segments.length) return [`segment count ${s.segments.length} != ${orig.segments.length}`];
  s.segments.forEach((g, i) => {
    if (rest(g) !== rest(orig.segments[i])) e.push(`seg ${i}: non-visual fields changed`);
    const vs = vis(g), ov = vis(orig.segments[i]); if (!vs.length || vs.length > 2) e.push(`seg ${i}: ${vs.length} visuals`);
    const check = (v, tag) => { if (!v || !VIS[v.type]) return e.push(`${tag}: visual type ${v && v.type}`);
      if (v.type === 'scene') { if (v.place && !PLACES.includes(v.place)) e.push(`${tag}: place ${v.place}`); const pp = v.people || [];
        if (pp.length > 6) e.push(`${tag}: ${pp.length} people`); pp.forEach(p => { if (!ROLES.includes(p.role)) e.push(`${tag}: role ${p.role}`); if (p.does && !DOES.includes(p.does)) e.push(`${tag}: does ${p.does}`); if (p.mood && !MOODS.includes(p.mood)) e.push(`${tag}: mood ${p.mood}`); });
        if (v.pass && (!Array.isArray(v.pass) || v.pass.length !== 2 || v.pass.some(k => !(k >= 0 && k < pp.length)))) e.push(`${tag}: pass index`); }
      if (v.type === 'object' && v.item && !ITEMS.includes(v.item)) e.push(`${tag}: item ${v.item}`);
      if (v.type === 'mistake' && v.over) check(v.over, tag + ' over'); };
    vs.forEach((v, k) => check(v, `seg ${i}.${k}`));
    // text cards (title, list, number, timeline...) carry facts: their words must stay as they were
    const ot = ov.filter(v => !['scene', 'reaction', 'object'].includes(v.type)).map(texts).sort().join('|');
    const nt = vs.filter(v => !['scene', 'reaction', 'object'].includes(v.type)).map(texts).sort().join('|');
    if (ot !== nt) e.push(`seg ${i}: text card content changed`);
  });
  return e;
}
(async () => {
  if (!src || !dst) { console.error('usage: node scripts/improve.js <script.json> <out.json>'); process.exit(0); }
  const orig = JSON.parse(fs.readFileSync(src, 'utf8'));
  let L = null; try { L = JSON.parse(fs.readFileSync(path.join(ROOT, 'qa', 'learnings.json'), 'utf8')); } catch {}
  if (!L || !(L.do.length + L.avoid.length + (L.recentBad || []).length)) return log('no visual learnings yet, script stays as written');
  if (!G.hasKey()) return log('no GEMINI_API_KEY, script stays as written');
  let fmt = ''; try { const s = fs.readFileSync(path.join(ROOT, 'docs', 'SCRIPT.md'), 'utf8'); const k = s.indexOf('### Visual types'); fmt = k >= 0 ? s.slice(k, k + 2500) : ''; } catch {}
  const rule = x => `- (${x.n}x, ${x.area}) ${x.rule}`;
  const prompt = `You choose the pictures for a short explainer reel about mate. Earlier reels were analysed for their visual representation; use these VISUAL learnings to pick visuals that will be drawn cleanly and logically.

Visual learnings - do more of:
${L.do.map(rule).join('\n') || '-'}
Visual learnings - avoid:
${L.avoid.map(rule).join('\n') || '-'}
Recent visual problems:
${(L.recentBad || []).map(x => '- ' + x).join('\n') || '-'}

Visual format (only these types, places, roles, does and moods exist):
${fmt}

RULES:
- Change ONLY "visual"/"visuals" of segments. Never change text, headline, headlineAt, impact, emo, beat or any other field.
- Keep the words on text cards (title, list, checklist, number, dots, timeline, mistake text) exactly as they are.
- The picture must show what the sentence says. Keep the same segment count and order.
- Change only what the learnings justify (e.g. avoid a pose or crowd that was drawn badly, prefer combinations that were clean). If nothing needs changing, return the segments unchanged.

Segments:
${JSON.stringify(orig.segments, null, 1)}

Answer ONLY with JSON: {"segments":[...all segments...],"changes":["<short English: segment N, what you changed, which learning it follows>"]}`;
  let r; try { r = await G.generate([{ text: prompt }], { temperature: 0.3 }); } catch (e) { return log('Gemini failed, script stays as written:', e.message.slice(0, 160)); }
  const out = { ...orig, segments: r.data.segments }; const errs = validate(orig, out); const changes = r.data.changes || [];
  const side = dst.replace(/\.json$/, '.changes.json');
  if (errs.length) { log(`revision rejected (${errs.length} problem(s): ${errs.slice(0, 4).join('; ')}), original is built`); fs.writeFileSync(side, JSON.stringify({ model: r.model, applied: false, errors: errs, changes }, null, 1)); return; }
  if (JSON.stringify(out.segments) === JSON.stringify(orig.segments)) return log('no visual changes needed');
  out.improved = { model: r.model, at: new Date().toISOString(), changes };
  fs.writeFileSync(dst, JSON.stringify(out, null, 1)); fs.writeFileSync(side, JSON.stringify({ model: r.model, applied: true, changes }, null, 1));
  log(`applied ${changes.length} visual change(s) with ${r.model}:`); changes.slice(0, 8).forEach(c => log(' - ' + c));
})().catch(e => { console.error('[improve] failed, original is built:', e.message); process.exit(0); });
