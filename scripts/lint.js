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
const MOVE = /^(uno|dos|tres|cuatro|cinco|seis)\b|\b(sube|invit|lleg|lleg[aá]s|vas\b|vamos|fuiste|fue\b|despu[eé]s|al otro d[ií]a|viaj|sal[eií]|entr[aá]|volv|cruz|en casa|a casa|de casa)/i;
const NAMED = (() => { try { return require('../styles/lexicon').ROLE_WORDS; } catch { return null; } })() || [[/\bsuegra\b/, ['suegra']], [/\bsuegro\b/, ['suegro']], [/\bcuñad[oa]/, ['cunado']], [/\babuela\b/, ['grandma']], [/\babuelo\b/, ['grandpa']], [/\bjefe\b/, ['jefe']], [/\bnovi[oa]\b|\bpareja\b/, ['novia']], [/\bcebador/, ['cebador']], [/\bgaucho/, ['gaucho']], [/\bturista/, ['turista']], [/\btu viejo\b|\bpap[aá]\b/, ['papa']], [/\bnene|\bnena|\bhij[oa]s?\b|\bchic[oa]s\b/, ['kid']]];
const VOS = /\b(vos|sos|tom[aá]s|ceb[aá]s|hac[eé]s|llen[aá]s|herv[ií]s|pon[eé]s|sab[eé]s|us[aá]s|llev[aá]s|ten[eé]s|dec[ií]s|quer[eé]s|est[aá]s)\b/i;
function pictureChecks(S, W, j) { const youRole = j.you_role || 'you'; const freePlaces = j.places === 'free'; const LEX = (() => { try { return require('../styles/lexicon').LEX; } catch { return []; } })();
  let lastPlace = null, prevPlace = null, lastPeople = [];
  S.forEach((g, i) => { const t = norm(g.text); const V = vis(g); const scenes = V.map(v => v.type === 'mistake' ? v.over : v).filter(v => v && v.type === 'scene');
    if (V.length && V.every(v => BOARD.has(v.type))) return; const roles = new Set(scenes.flatMap(v => (v.people || []).map(p => p.role))); V.filter(v => v.type === 'reaction').forEach(v => roles.add(v.role || lastPeople[v.who || 0] || 'cebador'));
    // place
    scenes.forEach(v => { const p = norm(v.place); if (v.flashback) return; if (lastPlace && !freePlaces && !v.moves && p !== lastPlace && p.split('_')[0] !== lastPlace.split('_')[0]) { if (p === prevPlace) W(`seg ${i}: place jumps back (${prevPlace} -> ${lastPlace} -> ${p}); keep one place`); else if (!MOVE.test(t) && !t.includes(p)) W(`seg ${i}: place changes ${lastPlace} -> ${p} but the sentence does not move there (keep ${lastPlace} or say where they go)`); }
      if (p !== lastPlace) { prevPlace = lastPlace; lastPlace = p; } if ((v.people || []).length) lastPeople = v.people.map(q => q.role); });
    // named people
    NAMED.forEach(([re, rs]) => { if (re.test(t) && !rs.some(r => roles.has(r))) W(`seg ${i}: names "${t.match(re)[0]}" but nobody in the picture is ${rs.join('/')}`); });
    // named things need a scene to stand in
    LEX.forEach(([re, key]) => { if (re.test(t) && !scenes.length) W(`seg ${i}: names "${key}" but the picture has no scene to show it in`); });
    // the viewer: a sentence about "vos" shows you, never the cebador
    if (VOS.test(t) && !roles.has('you') && !roles.has(youRole) && !V.some(v => ['title', 'list', 'checklist', 'number', 'dots', 'timeline'].includes(v.type)) && i < S.length - 1) W(`seg ${i}: the sentence is about vos but "you" is not in the picture (${[...roles].join(', ') || 'nobody'})`);
    V.filter(v => v.type === 'reaction' && v.role && !lastPeople.includes(v.role)).forEach(v => W(`seg ${i}: reaction role "${v.role}" is not in the scene before`)); }); }
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
  // one picture per sentence: the place only changes when the story moves, named people and things are in the picture, a reaction shows the person the sentence is about
  pictureChecks(S, W, j);
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
  // 3D: every verb needs an action in styles/build3d.js, and every scene needs somebody who does something
  try { const B = require('../styles/build3d'); const scenes = S.flatMap(g => (g.visuals || [g.visual])).filter(v => v && v.type === 'scene');
    const miss = B.missingVerbs(scenes.flatMap(v => (v.people || []).map(q => q.does || ''))); if (miss.length) W('verbs without a 3D action (add them to VERBS in styles/build3d.js): ' + miss.join(', '));
    const idle = scenes.filter(v => (v.people || []).length && (v.people || []).every(q => !q.does || q.does === 'idle')).length; if (idle) W(idle + ' scene(s) where nobody does anything (give somebody a "does")'); } catch (e) { }
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
