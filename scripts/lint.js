// Retention check for queue scripts (docs/WATCHTIME.md sections 0-11). Never blocks: prints findings, exit code 0.
// usage: node scripts/lint.js [queue/xxxx.json ...]   (no args = every script in queue/)
// Time is estimated from the words (narrator incl. pauses ~3 words/s, fitted on our posted reels).
const fs = require('fs'), path = require('path');
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const WPS = 3.0, PAUSE = 0; // fitted on posted reels 0001-0014 (107 words ≈ 37.5 s)
const words = s => String(s || '').split(/\s+/).filter(Boolean).length;
const vis = g => g.visuals || (g.visual ? [g.visual] : []);
const BOARD = new Set(['title', 'list', 'checklist', 'number', 'dots', 'timeline']);
const YOU = /\b(tu|tus|te|vos|sos|tenés|tomás|hacés|cebás|llenás|hervís|ponés|sabés|usás|llevás)\b/i;
const LOOP = /\b(por qué|a propósito|secreto|truco|nadie|razón|motivo|en realidad|no es|pero|hay uno|hay una)\b/i;
const REHOOK = /^(pero|y no solo|y encima|esperá|ojo|lo peor|lo mejor|y lo más|ahora|y ahí|aunque|sin embargo|y si)\b/i;
const PERSON = /(^|[^a-záéíóúñ])(cebador|cebadora|abuel[oa]|suegr[oa]|compañer[oa]|tí[oa]|vecin[oa]|amig[oa]|novi[oa]|viej[oa]|mamá|papá|herman[oa]|cuñad[oa]|brasileño|uruguayo|paraguayo|jefe|ronda)(?=[^a-záéíóúñ]|$)/i;
function lint(j) {
  const out = []; const W = m => out.push(m); const S = j.segments || [];
  let t = 0; const at = S.map(g => { const a = t; t += words(g.text) / WPS + PAUSE; return a; }); const dur = t;
  // length
  if (dur < 33 || dur > 46) W(`length ~${dur.toFixed(0)} s (target 35-45 s)`);
  // hook: first sentence, about the viewer, short, no trivia opener
  const h = String(S[0] && S[0].text || '');
  if (/^¿?sab[ií]as que/i.test(h)) W('hook opens with "¿Sabías que…" (flops on every channel)');
  if (words(h) > 14) W(`hook has ${words(h)} words (max 14: it must be said in ~4 s)`);
  if (!YOU.test(h)) W('hook does not speak to the viewer (tu / vos / a verb in vos form)');
  const v0 = vis(S[0] || {})[0] || {}; if (BOARD.has(v0.type)) W('hook picture is a text board: show the thing or the person in action from frame 1');
  // open loop in the first ~10 s
  const loopIdx = S.findIndex((g, i) => at[i] <= 10 && (g.beat === 'loop' || LOOP.test(g.text)));
  if (loopIdx < 0) W('no open loop (secret / reason / "pero…") in the first 10 s');
  // person of the ronda named early
  if (!S.slice(0, 3).some(g => PERSON.test(g.text))) W('no person of the ronda named in the first three sentences (cebador, abuela, suegra…)');
  // re-hooks every 8-12 s
  const re = S.map((g, i) => (g.beat === 'rehook' || REHOOK.test(String(g.text).trim())) && i > 0 ? at[i] : null).filter(x => x != null);
  let last = at[loopIdx >= 0 ? loopIdx : 0] || 0; const gaps = [];
  [...re, dur - 4].forEach(x => { if (x - last > 13) gaps.push(`${last.toFixed(0)}–${x.toFixed(0)} s`); last = Math.max(last, x); });
  if (gaps.length) W(`no re-hook for more than 13 s: ${gaps.join(', ')} (add "Pero…", "Y encima…", "Esperá…", a new question or a twist)`);
  // something new on screen at least every ~4 s
  S.forEach((g, i) => { const d = words(g.text) / WPS; if (d > 4.6 && vis(g).length < 2) W(`seg ${i}: ~${d.toFixed(1)} s with one picture (split it or give it a second visual)`); });
  // boards: at most three, never two in a row
  const boards = S.map((g, i) => !(j.poll && i === S.length - 1) && vis(g).some(v => BOARD.has(v.type) && (v.text || v.value || v.items || v.rows || v.label || v.on != null)));
  const nb = boards.filter(Boolean).length; if (nb > 3) W(`${nb} text boards (max 3; show it as a scene, object or compare)`);
  boards.forEach((b, i) => { if (b && boards[i - 1]) W(`seg ${i - 1}-${i}: two text boards in a row`); });
  // variety: the same place three sentences in a row looks like one long shot
  { let run = 1, pl = null; S.forEach((g, i) => { const v = vis(g)[0]; const p = v && v.type === 'scene' ? norm(v.place) : null; if (p && p === pl) { run++; if (run === 3) W('seg ' + (i - 2) + '-' + i + ': the same place (' + p + ') three times in a row'); } else { run = 1; pl = p; } }); }
  // humour: the reels may be silly; at least one funny sentence
  if (!S.some(g => g.emo === 'funny')) W('no funny moment (one sentence with emo "funny": slapstick, exaggerated reaction, cheeky comparison)');
  // thumbnail: big letters (two short lines)
  if (!j.thumb || !(j.thumb.lines || []).length) W('no thumb (thumb.lines: two short lines in big letters for the cover)'); else if (j.thumb.lines.some(x => String(x).length > 16)) W('thumb line longer than 16 characters');
  // ending: question about the viewer's own habit + share line + poll
  const e = String(S[S.length - 1] && S[S.length - 1].text || '');
  if (!/\?/.test(e)) W('last sentence is no question to the viewer');
  if (!/mand[aá]selo|etiquet[aá]|compart/i.test(e)) W('last sentence has no share line ("Mandáselo a…")');
  if (!j.poll || !(j.poll.options || []).length) W('no poll (three options about the viewer\'s own habit)');
  // caption starts with the hook
  const c0 = String(j.caption || '').split('\n')[0]; if (c0 && h && !c0.toLowerCase().startsWith(h.slice(0, 18).toLowerCase())) W('caption line 1 is not the hook sentence');
  return { dur, out };
}
if (require.main === module) {
  const Q = path.join(__dirname, '..', 'queue'); let files = process.argv.slice(2);
  if (!files.length) files = fs.existsSync(Q) ? fs.readdirSync(Q).filter(f => f.endsWith('.json')).map(f => path.join(Q, f)) : [];
  let n = 0; for (const f of files) { try { const r = lint(JSON.parse(fs.readFileSync(f, 'utf8'))); n += r.out.length;
      console.log(`${path.basename(f)}  ~${r.dur.toFixed(0)} s  ${r.out.length ? '' : 'ok'}`); r.out.forEach(m => console.log('   - ' + m)); }
    catch (e) { console.log(path.basename(f), 'unreadable:', e.message); } }
  console.log(`[lint] ${files.length} scripts, ${n} findings`);
}
module.exports = { lint };
