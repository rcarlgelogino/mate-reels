// pixel8 style translator: style-neutral script (docs/SCRIPT.md) -> render spec for the pixel-art world (template pix).
// Text, headlines, callouts and the poll come 1:1 from flat2d (like toy3d), only the pictures change.
// People are pixel figures (round head with face, flag on the shirt, floating ball hands); objects are big cute heroes with a face and a glow behind;
// titles and numbers are big pixel letters over the scene; lists, checklists, dots and timelines are a pixel panel over the dimmed scene.
const flat2d = require('./flat2d');
const { norm, person, FACE, ACTS, GEST, ROLE, hashN, placeOf, MATES } = require('./toy3d').helpers;
const GY = 738;
// toy3d place names -> pixel places (the meadow of toy3d becomes the sunny yerbal)
const PLACE = { prado: 'yerbal', cocina: 'cocina', living: 'living', oficina: 'oficina', bano: 'bano', super: 'super', mercado: 'mercado', galpon: 'galpon', selva: 'selva', playa: 'playa', ruta: 'ruta', plaza: 'plaza', patio: 'patio', yerbal: 'yerbal' };
function placeOfPx(name) { const k = norm(name); if (/noche|night|terraza|balcon|azotea/.test(k) && !/selva|monte|choza/.test(k)) return /cocina|casa/.test(k) ? 'cocina' : 'noche'; if (/atardecer|campo|estancia/.test(k)) return 'campo'; if (/choza|aldea/.test(k)) return 'selva'; if (/secadero|fabrica|molino/.test(k)) return 'galpon'; return PLACE[placeOf(name)] || 'yerbal'; }
const isNight = name => /noche|night|luna/.test(norm(name));
// ---- camera plans over the pixels ----
// big camera moves like science_in_8bit: cranes from the sky down into the scene, long pans across the layers, dollies from wide to close
const SOLO = ['dolly', 'snap', 'panR', 'crane', 'tight', 'pull', 'panL'], GROUP = ['wide', 'dolly', 'panR', 'crane', 'pull', 'panL'], HERO = ['dolly', 'crane', 'pull', 'snap', 'panL'], REACT = ['snap', 'tight', 'push'];
function chooser(seed) { const used = {}; let last = null, k = hashN(seed, 97); return (pool, avoid) => { let best = null, bs = 1e9; pool.forEach((c, i) => { if (c === last || c === avoid) return; const sc = (used[c] || 0) * 100 + ((i + k) % pool.length); if (sc < bs) { bs = sc; best = c; } }); best = best || pool[0]; used[best] = (used[best] || 0) + 1; last = best; k += 7; return best; }; }
function cam(kind, f, mid) { const c = f || mid, m = mid || [270, 600];
  switch (kind) { case 'wide': return { z0: 0.86, z1: 0.98, c0: [m[0] - 70, m[1] - 20], c1: [m[0] + 50, m[1]] }; case 'dolly': return { z0: 0.72, z1: 1.45, c0: [m[0] - 70, m[1] - 140], c1: c }; case 'wide3': return { z0: 0.78, z1: 0.84, c0: [270, 600], c1: [270, 600] }; case 'wide4': return { z0: 0.6, z1: 0.66, c0: [270, 620], c1: [270, 620] }; case 'push': return { z0: 0.9, z1: 1.45, c0: m, c1: c }; case 'pull': return { z0: 1.6, z1: 0.82, c0: c, c1: [m[0] + 40, m[1] - 60] };
    case 'panR': return { z0: 1.12, z1: 1.2, c0: [m[0] - 130, m[1] - 20], c1: [m[0] + 120, m[1]] }; case 'panL': return { z0: 1.12, z1: 1.2, c0: [m[0] + 130, m[1] - 20], c1: [m[0] - 120, m[1]] };
    case 'snap': return { z0: 1.0, z1: 1.55, c0: m, c1: [c[0], c[1] + 30], snap: 0.38 }; case 'tight': return { z0: 1.42, z1: 1.52, c0: [c[0], c[1] + 30], c1: [c[0], c[1] + 30] }; case 'crane': return { z0: 1.0, z1: 1.22, c0: [m[0] - 30, m[1] - 280], c1: [m[0], m[1] + 10] };
    case 'act': return { z0: 1.45, z1: 1.75, c0: c, c1: c }; default: return { z0: 1, z1: 1.1, c0: m, c1: m }; } }
// ---- people ----
function layout(n) { if (n <= 1) return [{ x: 270, s: 150 }]; if (n === 2) return [{ x: 172, s: 132 }, { x: 368, s: 132 }]; if (n === 3) return [{ x: 112, s: 114 }, { x: 270, s: 118 }, { x: 428, s: 114 }];
  if (n === 4) return [86, 208, 332, 454].map(x => ({ x, s: 98 })); return Array.from({ length: n }, (_, i) => ({ x: Math.round(64 + i * 412 / (n - 1)), s: 80 })); }
function figure(pp, i) { const o = person(pp, i); const q = { kind: 'person', ...o }; delete q.who; if (o.act === 'drink' || o.act === 'pour') q.act = o.act; else delete q.act; const d = norm(pp.does); if (ACTS.includes(d)) q.emoAct = d; if (d === 'run' || d === 'walk') q.emoAct = 'nod'; return q; }
const headOf = q => [q.x, q.y - Math.round(q.s * 0.7)];
function sceneShots(v, si, pick, words, st) { const src = (v.people || []).slice(0, 6); const cast = src.map(figure); if (!cast.length) cast.push({ kind: 'mate', s: 150, glow: true, face: 'smile' });
  const L = layout(cast.length); cast.forEach((q, i) => { q.x = L[i].x; q.y = GY; q.s = q.kind === 'person' ? L[i].s : q.s; }); st.cast = cast.filter(c => c.kind === 'person').map(c => ({ ...c, act: undefined, gest: undefined, emoAct: undefined }));
  const place = placeOfPx(v.place); st.place = place; st.night = isNight(v.place); const p = { place, cast }; if (st.night) p.night = true;
  const props = (v.props || []).map(q => norm(typeof q === 'string' ? q : q.type)).filter(Boolean).slice(0, 3); if (props.length) p.props = props;
  const busy = cast.findIndex(q => q.act); let focus = v.focus ?? (busy >= 0 ? busy : v.pass ? v.pass[0] : 0); if (!cast[focus]) focus = 0;
  if (v.pass && cast[v.pass[0]] && cast[v.pass[1]] && cast[v.pass[0]].kind === 'person') { const [a, b] = v.pass; p.pass = [a, b]; const A = cast[a], B = cast[b]; if (A.hold === 'both') A.hold = 'termo'; else if (A.hold === 'mate' || A.hold === 'termo_brazo') A.hold = null; A.gest = 'offer'; B.gest = 'receive'; B.hold = null; A.facing = B.x > A.x ? 1 : -1; B.facing = A.x > B.x ? 1 : -1; }
  const emo = src.map(pp => norm(pp.mood)); cast.forEach((q, i) => { if (emo[i] && FACE[emo[i]]) q.face = FACE[emo[i]]; if (q.face === 'love' && !q.emote) q.emote = 'heart';  });
  const mid = [Math.round(cast.reduce((a, q) => a + q.x, 0) / cast.length), 600]; const fq = cast[focus]; const fpt = fq.kind === 'person' ? headOf(fq) : [fq.x, fq.y - 80];
  const act = busy >= 0 ? cast[busy].act : null; const mk = kind => ({ tpl: 'pix', p: { ...p, cam: cam(kind, act ? [fq.x + (act === 'pour' ? -fq.s * 0.25 : 0), fq.y - fq.s * (act === 'drink' ? 0.6 : 0.4)] : fpt, mid) } });
  if (v.camera) return [mk(v.camera)]; if (act) return [mk(pick(['act', 'push']))];
  if (words >= 8 && cast.length >= 1 && cast.length <= 3) { const a = cast.length >= 3 ? 'wide3' : pick(cast.length <= 1 ? SOLO : ['push', 'snap', 'wide']); return [mk(a), mk(pick(['snap', 'tight', 'push'], a))]; }
  const first = cast.length >= 4 ? 'wide4' : cast.length === 3 ? pick(['wide3', 'push', 'crane']) : pick(cast.length <= 1 ? SOLO : si === 0 ? ['push', 'snap', 'wide'] : GROUP); return [mk(first)]; }
const EMOTE = { think: '?', confused: '?', surprised: '!', worried: 'sweat', angry: 'anger', love: 'heart', bored: 'zzz', outraged: 'anger' };
function reactionShot(v, si, pick, st) { const who = v.who ?? (si % 6); const base = Object.values(ROLE).find(r => r && r.who === who && !r.flag && !r.hat) || { shirt: '#2f7fd1', hair: 'short' }; const q = { kind: 'person', ...base, x: 270, y: GY, s: 160 }; delete q.who; delete q.scale;
  const e = FACE[norm(v.emotion)] || 'surprised'; q.face = e; const a0 = norm(v.act); if (GEST.includes(a0)) q.gest = a0; if (a0 === 'teeth') q.face = 'disgusted'; if (a0 === 'burn_tongue') { q.face = 'pain'; q.emote = 'sweat'; } if (ACTS.includes(a0)) q.emoAct = a0;
  q.emote = q.emote || EMOTE[a0] || EMOTE[e] || null; const p = { place: st.place, cast: [q], cam: cam(v.camera || pick(REACT), headOf(q), [270, 600]) }; if (st.night) p.night = true; return { tpl: 'pix', p }; }
// ---- objects: the thing itself, big, with a face and a glow ----
const CUT = ['corte_interior', 'corte_polvo_arriba', 'corte_polvo_abajo', 'corte_un_costado_mojado', 'nivel_tres_cuartos', 'yerba_se_hincha', 'chorrito_fino', 'clavar_bombilla_pulgar'];
const THINGS = ['celular', 'facturas', 'bizcochitos', 'azucarera', 'termometro', 'jarra_con_hielo', 'heladera', 'heladerita', 'bolsa_nylon_yerba', 'tacuapi', 'guampa', 'hoja_yerba', 'planta_yerba', 'rama_yerba', 'calabaza_planta', 'mano_con_polvo', 'auto', 'camioneta', 'colectivo', 'camion', 'reloj', 'calendario', 'olla', 'mortero'];
function heroOf(v, x = 270, s = 150) { const it = norm(v.item || 'mate'), an = norm(v.animate), va = norm(v.variant); const h = { x, y: GY, s, glow: true, face: 'smile' };
  if (it === 'mate' || MATES[it] || it === 'cuia') { if (CUT.includes(an)) return { ...h, kind: 'cut', anim: an, glow: false, s: s * 1.25 }; Object.assign(h, { kind: 'mate', type: it === 'cuia' ? 'cuia' : MATES[it] || 'calabaza' });
    if (va) h.variant = va; if (an === 'humo_fuerte') { h.steam = 5; h.face = 'pain'; } if (va === 'con_moho') h.face = 'disgusted'; if (va === 'lleno_hasta_arriba') h.face = 'worried'; if (an === 'zoom_poros') h.poros = true; return h; }
  if (it === 'termo' || it === 'termo_abollado') return { ...h, kind: 'termo', variant: it === 'termo_abollado' ? 'abollado' : va || null, face: it === 'termo_abollado' ? 'pain' : 'smile', s: s * 1.1 };
  if (/^yerba/.test(it) || it === 'paquete_yerba') return { ...h, kind: 'yerba', variant: /brasil/.test(it) ? 'brasil' : null, s: s * 1.05 };
  if (it === 'pava' || it === 'kettle') return { ...h, kind: 'pava', anim: an || null, steam: an ? 4 : 0, variant: va || null };
  if (it === 'bombilla' || it === 'bombillas') return v.kind ? { ...h, kind: 'bombilla', kind2: norm(v.kind), glow: true } : { ...h, kind: 'bombillas', kinds: v.kinds, glow: false, s: 110 };
  if (THINGS.includes(it)) return { ...h, kind: it, anim: an || null, face: ['heladera', 'hoja_yerba'].includes(it) ? 'smile' : null, glow: !['auto', 'camioneta', 'colectivo', 'camion'].includes(it) };
  return { ...h, kind: 'mate', type: 'calabaza' }; }
function heroShot(v, pick, st) { const h = heroOf(v); if (h.kind === 'bombilla') h.bkind = h.kind2 || 'recta'; delete h.kind2; const p = { place: h.poros ? 'poros' : st.place, cast: h.poros ? [] : [h] };
  if (st.night) p.night = true; p.cam = cam(v.camera || pick(HERO), [270, GY - 90], [270, 620]); if (v.label) p.tags = [{ text: String(v.label).toUpperCase(), x: 530, y: 1340, screen: true, size: 64, u: 0.1 }]; return { tpl: 'pix', p }; }
const W2 = 540;
function compareShot(v, pick, st) { const a = heroOf(v.left || {}, 160, 118), b = heroOf(v.right || {}, 380, 118); a.glow = b.glow = false; const p = { place: st.place, cast: [a, b], vs: { y: 1050 }, cam: cam('wide', null, [270, 620]) };
  p.tags = [[v.left, 160], [v.right, 380]].filter(([s]) => s && s.label).map(([s, x]) => ({ text: String(s.label).toUpperCase(), x, y: GY + 30, size: 54, u: 0.12 })); if (st.night) p.night = true; return { tpl: 'pix', p }; }
// what a title is about decides the picture behind it: countries -> the lit map from above, Guaraní -> people in the jungle, Jesuits -> the mission; otherwise the last scene again
const CTRY = [[/argentin/, 'ar'], [/urugua/, 'uy'], [/paragua/, 'py'], [/brasil|brazil/, 'br'], [/chile/, 'cl']];
const countriesIn = k => CTRY.filter(([re]) => re.test(k)).map(c => c[1]);
function sceneForText(k, st) { const cs = countriesIn(k); const big = (t, s) => ({ text: String(t).toUpperCase(), sub: s ? String(s).toUpperCase() : undefined, y: 560, size: String(t).length > 10 ? 96 : 120 });
  if (cs.length) return { place: 'mapa', lit: cs.map((c, i) => ({ c, u: 0.08 + i * 0.16 })), cam: { z0: 0.72, z1: 0.86, c0: [270, 520], c1: [270, 560] }, _big: big };
  if (/guaran|indigen|ka_a|caa|tribu|ancestr|originari/.test(k)) return { place: 'selva', cast: [{ kind: 'person', ...person({ role: 'guarani', does: 'hold_cuia', mood: 'happy' }, 0), x: 190, y: GY, s: 132 }, { kind: 'person', ...person({ role: 'anciano_guarani', does: 'drink', mood: 'happy' }, 1), x: 360, y: GY, s: 128 }], cam: cam('push', [190, GY - 92], [270, 600]), _big: big };
  if (/jesuit|mision|iglesia|cura|monje/.test(k)) return { place: 'mision', cast: [{ kind: 'person', shirt: '#5a3a24', robe: true, hair: 'short', hairColor: '#3a2416', face: 'smile', x: 200, y: GY, s: 128, hold: 'mate' }, { kind: 'person', ...person({ role: 'guarani', does: 'receive', mood: 'surprised' }, 1), x: 370, y: GY, s: 124 }], cam: cam('crane', [270, 600], [270, 600]), _big: big };
  return null; }
function bigShot(text, sub, pick, st, segText) { const k = norm(text + ' ' + (sub || '') + ' ' + (segText || '')); const sc = sceneForText(k, st);
  if (sc) { const p = { ...sc, big: sc._big(text, sub) }; delete p._big; if (p.cast) p.cast.forEach(c => { delete c.who; if (c.act === 'drink') c.act = 'drink'; }); return { tpl: 'pix', p }; }
  if (st.cast && st.cast.length) return { tpl: 'pix', p: { place: st.place, cast: JSON.parse(JSON.stringify(st.cast)), big: { text: String(text).toUpperCase(), sub: sub ? String(sub).toUpperCase() : undefined, y: 560, size: String(text).length > 10 ? 96 : 120 }, cam: cam('pull', [270, 620], [270, 600]), ...(st.night ? { night: true } : {}) } };
  return bigShotOld(text, sub, pick, st); }
function bigShotOld(text, sub, pick, st) { return { tpl: 'pix', p: { place: 'titulo', big: { text: String(text).toUpperCase(), sub: sub ? String(sub).toUpperCase() : undefined, y: 900 }, cam: { z0: 1.0, z1: 1.12, c0: [270, 480], c1: [270, 470] } } }; }
function boardShot(s, st) { if (!s || s.tpl !== 'board' || !s.p || (s.p.kind === 'title' && !s.p.text)) return s; const { bg, scene, time, tableY, ...board } = s.p; const p = { place: st.place, board, dim: 0.3, cam: { z0: 0.95, z1: 1.0, c0: [270, 600], c1: [270, 600] } }; if (st.night) p.night = true; return { tpl: 'pix', p }; }
function toSpec(script) {
  const base = flat2d.toSpec(script, { plain: true }); const pick = chooser(script.id || 'reel'); const first = script.segments.map(g => (g.visuals || [g.visual])).flat().find(v => v && v.type === 'scene'); const st = { place: first ? placeOfPx(first.place) : 'noche', night: first ? isNight(first.place) : false };
  base.segments.forEach((seg, si) => { const sg = script.segments[si]; const vis = sg.visuals || [sg.visual]; const words = String(sg.text || '').split(/\s+/).filter(Boolean).length;
    if (script.poll && si === script.segments.length - 1) { seg.shots = seg.shots.map(s => boardShot(s, st)); return; }
    const out = []; seg.shots.forEach((s, k) => { const v = vis[k]; if (!v) return out.push(boardShot(s, st));
      if (v.type === 'scene') return out.push(...sceneShots(v, si, pick, vis.length > 1 ? 0 : words, st)); if (v.type === 'reaction') return out.push(reactionShot(v, si, pick, st));
      if (v.type === 'object') return out.push(heroShot(v, pick, st)); if (v.type === 'compare') return out.push(compareShot(v, pick, st));
      if (v.type === 'map' || (v.type === 'list' && countriesIn(norm((v.items || []).map(i => i.title).join(' '))).length >= 2)) { const cs = v.type === 'map' ? (v.countries || []) : countriesIn(norm((v.items || []).map(i => i.title).join(' '))); return out.push({ tpl: 'pix', p: { place: 'mapa', lit: cs.map((c, i) => ({ c, u: 0.08 + i * Math.min(0.2, 0.7 / cs.length) })), cam: { z0: 0.7, z1: 0.84, c0: [270, 500], c1: [270, 560] }, ...(v.text ? { big: { text: String(v.text).toUpperCase(), sub: v.sub ? String(v.sub).toUpperCase() : undefined, y: 560, size: 100 } } : {}) } }); }
      if (v.type === 'map') { const p = { place: st.place, map: { countries: v.countries || [], text: v.text ? String(v.text).toUpperCase() : '', sub: v.sub ? String(v.sub).toUpperCase() : '' }, dim: 0.35, cam: cam('wide', null, [270, 600]) }; if (st.night) p.night = true; return out.push({ tpl: 'pix', p }); }
      if (v.type === 'title' && v.text) return out.push(bigShot(v.text, v.sub, pick, st, sg.text)); if (v.type === 'number' && v.value != null) return out.push(bigShot(v.value, v.sub, pick, st, sg.text));
      if (v.type === 'mistake') { const sh = sceneShots(v.over || { type: 'scene', people: [{ role: 'friend', does: 'no' }] }, si, pick, 0, st)[0]; sh.p.cast.forEach(q => { if (q.kind === 'person') { q.emoAct = 'no'; q.face = q.face === 'happy' ? 'worried' : q.face; } }); return out.push(sh); }
      out.push(boardShot(s, st)); }); seg.shots = out; });
  base.segments.forEach(seg => { const textual = seg.shots.length && seg.shots.every(s => s.p && (s.p.big || s.p.board || s.p.map)); seg.callouts = (seg.callouts || []).filter(c => c.type !== 'big' && !(textual && c.type === 'pill' && !c.early)).map(c => { if (c.early) { const { sub, ...rest } = c; return { ...rest, y: 1300 }; } return c; }); });
  // light mood of the reel (sun, haze, rays, lit windows): rotates per script so the days look different
  const LIGHTS = ['golden', 'blue', 'pastel']; base.style = { ...(base.style || {}), light: script.light || LIGHTS[hashN(script.id || 'reel', 3)] };
  return { ...base, preset: 'pixel8', ab: script.ab || 'style pixel8', ...(script.follow === false ? { follow: false } : {}) };
}
module.exports = { name: 'pixel8', toSpec };
