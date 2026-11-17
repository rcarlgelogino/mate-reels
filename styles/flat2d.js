// flat2d style translator: style-neutral script (docs/SCRIPT.md) -> render spec for the 2D vector look (templates flat + board)
const ROLE = { // appearance per role (who = palette index in the engine)
  cebador: { who: 0 }, friend: { who: 3 }, stranger: { who: 2 }, you: { who: 5 },
  grandma: { who: 4, hairStyle: 'bun', hair: '#bdb6ac', shirt: '#7c3aed', glasses: true },
  grandpa: { who: 1, hairStyle: 'short', hair: '#c9c2b8', shirt: '#2f6b8a', beard: true, glasses: true },
  kid: { who: 2, scale: 0.72 }, worker: { who: 1, hat: 'hardhat', shirt: '#f08a24' },
  // nations wear their flag on the shirt
  argentino: { who: 0, shirt: '#8cc4ee', flag: 'ar' }, uruguayo: { who: 3, shirt: '#f4f6f8', flag: 'uy' }, paraguayo: { who: 2, shirt: '#d43a3a', flag: 'py' }, brasileno: { who: 5, shirt: '#f6c800', pants: '#1f8a3b', flag: 'br' }, chileno: { who: 1, shirt: '#1f3f8f', flag: 'cl' }, aleman: { who: 0, shirt: '#2b2b2b', flag: 'de', glasses: true },
  gaucho: { who: 0, shirt: '#e9dfc8', pants: '#5a4636', hat: 'boina', hatColor: '#2b2b2b', scarf: '#d43a3a', mustache: true }, oficinista: { who: 3, shirt: '#f4f6f8', tie: '#c0392b' }, estudiante: { who: 2, shirt: '#3fa7a0', hairStyle: 'long' }, turista: { who: 5, shirt: '#ff8a5a', hairStyle: 'cap', capColor: '#f4f6f8' },
  suegra: { who: 4, hairStyle: 'bun', hair: '#b9b2a8', shirt: '#c2507a', necklace: '#f4efe6', apron: '#f4efe6' }, suegro: { who: 1, hair: '#c9c2b8', shirt: '#5a6b4a', mustache: true, glasses: true }, novia: { who: 2, hairStyle: 'long', shirt: '#ef6f9a' }, cunado: { who: 5, hairStyle: 'cap', capColor: '#2b2b2b', shirt: '#ef7a3a' },
  companera: { who: 2, hairStyle: 'long', shirt: '#3fa7a0', necklace: '#f2c230' }, companero_vivo: { who: 3, shirt: '#8a4fd0', shades: true }, jefe: { who: 1, shirt: '#2b3442', tie: '#c0392b', glasses: true },
  guarani: { who: 0, hairStyle: 'long', shirt: '#b5713a', pants: '#8a5a36', band: '#d43a3a', feather: '#2f9e6e', necklace: '#f2c230' }, anciano_guarani: { who: 1, hairStyle: 'long', hair: '#c9c2b8', shirt: '#b5713a', pants: '#8a5a36', band: '#d43a3a', feather: '#f2c230' },
  yasy_luna: { who: 2, hairStyle: 'long', hair: '#eef1f6', shirt: '#eef4ff', pants: '#dfe9ff', moon: true }, tarefero: { who: 5, shirt: '#c98a4a', pants: '#5a4636', hat: 'sombrero', hatColor: '#e3cf9a', scarf: '#2f6fd0' }, yuyera: { who: 4, hairStyle: 'bun', shirt: '#2f9e6e', headscarf: '#f2a922', apron: '#f4efe6' } };
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const ALIAS = { abuela: 'grandma', abuelo: 'grandpa', amigo: 'friend', amiga: 'friend', nino: 'kid', nina: 'kid', chico: 'kid', obrero: 'worker', trabajador: 'worker', argentina: 'argentino', uruguaya: 'uruguayo', paraguaya: 'paraguayo', brasilero: 'brasileno', brasilera: 'brasileno', brasilena: 'brasileno',
  chilena: 'chileno', alemana: 'aleman', student: 'estudiante', tourist: 'turista', companero: 'oficinista', cunada: 'novia', guaranies: 'guarani', yasy: 'yasy_luna', luna: 'yasy_luna', anciano: 'anciano_guarani', vendedora: 'yuyera', yerbatero: 'tarefero', cosechero: 'tarefero' };
const roleOf = (role, i) => { const k = norm(role); const r = ROLE[k] || ROLE[ALIAS[k]]; return r ? { ...r } : { who: role ? hashN(k, 6) : i }; };
const ITEMS2 = ['yerba', 'pava', 'celular', 'facturas', 'azucarera', 'bizcochitos', 'matera', 'termometro', 'bombilla', 'bolsa'];
const FACE2 = { excited: 'happy', dizzy: 'confused', preocupado: 'worried', asco: 'disgusted', dolor: 'pain', enojado: 'angry', sauer: 'angry', indignado: 'outraged', aburrido: 'bored', triste: 'sad', feliz: 'happy', sonriente: 'smile' };
const DOES = { idle: {}, hold_mate: { hold: 'mate' }, hold_termo: { hold: 'termo' }, hold_both: { hold: 'both' }, drink: { act: 'drink' }, pass: { act: 'pass' }, receive: { act: 'receive' }, offer: { act: 'offer' }, pour: { hold: 'both', act: 'pour' }, pour_cold_water: { hold: 'both', act: 'pour' }, pour_from_olla: { hold: 'both', act: 'pour' }, pour_lukewarm: { hold: 'both', act: 'pour' }, pour_fast: { hold: 'both', act: 'pour' },
  think: { act: 'think' }, shrug: { act: 'shrug' }, talk: { act: 'talk' }, whisper: { act: 'whisper' }, type: { act: 'talk' }, grind_mortar: { act: 'talk' }, defend: { act: 'point' }, reach_bombilla: { act: 'point' }, harvest: { act: 'point' },
  sit: { sit: true }, sit_phone: { sit: true, item: 'celular', act: 'phone' }, sit_hold_both: { sit: true, hold: 'both' }, film_phone: { item: 'celular', act: 'phone' }, carry_termo_brazo: { hold: 'both' }, carry_all: { hold: 'both' },
  hold_cuia: { hold: 'mate', mate: 'cuia' }, hold_guampa: { hold: 'mate', mate: 'guampa' }, blow_mate: { hold: 'mate', act: 'blow' }, shake_mate: { hold: 'mate', act: 'shake' }, empty_mate: { hold: 'mate', act: 'shake' }, wash_mate: { hold: 'mate', act: 'shake' }, rinse_mate: { hold: 'mate', act: 'shake' },
  shake_bombilla: { item: 'bombilla', act: 'shake' }, hug_mate: { hold: 'mate' }, scrape_spoon: { hold: 'mate' }, spit: { hold: 'mate' }, drink_tapado: { act: 'drink' }, drink_sin_bombilla: { act: 'drink' }, fill_yerba: { item: 'yerba' }, hold_yerba: { item: 'yerba' },
  hold_pava: { item: 'pava' }, use_pava_electrica: { item: 'pava' }, hold_bolsa_nylon: { item: 'bolsa' }, hold_bombilla: { item: 'bombilla' },
  wave: { act: 'wave' }, point: { act: 'point' }, hug: { act: 'hug' }, cheer: { act: 'cheer' }, jump: { act: 'jump' }, no: { act: 'no' }, nod: { act: 'nod' }, shock: { act: 'shock' }, laugh: { act: 'laugh' }, sigh: { act: 'sigh' } };
const PLACE = { kitchen: 'kitchen', home: 'kitchen', park: 'park', plaza: 'plaza', patio: 'patio', beach: 'beach' };
const BG = { red: '#e5483a', purple: '#7c3aed', blue: '#3b82f6', green: '#10b981', orange: '#f59e0b', teal: '#0ea5a4', navy: '#16233a' };
const REACT_COLORS = ['#7c3aed', '#e5483a', '#3b82f6', '#10b981', '#f59e0b'];
const NAVY = '#132033';
// x positions / sizes by number of people (feet y in 0..1 of the frame)
function layout(n, place) { if (place === 'kitchen') return layoutBase(n, 0.9).map(p => ({ ...p, s: Math.round(p.s * 1.12) })); return layoutBase(n, place === 'patio' || place === 'beach' || INSIDE.includes(place) ? 0.86 : 0.8); }
function layoutBase(n, ky) {
  if (n === 1) return [{ x: 0.5, y: ky + 0.06, s: 820 }];
  if (n === 2) return [{ x: 0.28, y: ky + 0.03, s: 700 }, { x: 0.74, y: ky + 0.03, s: 700 }];
  if (n === 3) return [{ x: 0.19, y: ky + 0.03, s: 620 }, { x: 0.5, y: ky + 0.04, s: 640 }, { x: 0.81, y: ky + 0.03, s: 620 }];
  if (n === 4) return [0.14, 0.38, 0.62, 0.86].map(x => ({ x, y: ky + 0.05, s: 540 }));
  return Array.from({ length: n }, (_, i) => i < 3 ? { x: [0.17, 0.5, 0.83][i], y: ky + 0.06, s: 560 } : { x: [0.33, 0.67, 0.5][i - 3], y: ky - 0.07, s: 430, back: true }); }
// place names (any wording) -> drawn 2D scenes
const PLACES2 = [[/supermercado|^super|gondola|almacen/, 'super'], [/mercado|feria|puesto/, 'mercado'], [/living|sala|sillon|suegr/, 'living'], [/selva|monte|jungla|choza|aldea/, 'selva'], [/yerbal|plantacion|cosecha|misiones|tarefa/, 'yerbal'], [/galpon|secadero|fabrica|molino|deposito/, 'galpon'],
  [/bano|ducha/, 'bano'], [/ruta|carretera|viaje|camino/, 'ruta'], [/cocina|kitchen|casa|home|hogar|comedor|desayuno/, 'kitchen'], [/oficina|office|trabajo|laburo|escritorio|reunion/, 'office'], [/plaza|ciudad|city|calle|street|centro|barrio|parada|colectivo|vereda|kiosco/, 'plaza'],
  [/patio|asado|parrilla|quincho|jardin|fondo|terraza|balcon|huerta/, 'patio'], [/playa|beach|costa|mar|rio|costanera|rambla|verano|vacaciones/, 'beach'], [/park|parque|campo|pradera|estancia/, 'park']];
const placeOf2 = name => { const k = norm(name); const hit = PLACES2.find(([re]) => re.test(k)); return hit ? hit[1] : (name ? 'park' : 'kitchen'); };
const INSIDE = ['living', 'super', 'galpon', 'office', 'bano'];
// props a script names -> things drawn behind the figures
const PROPS2 = [[/fogata|fuego/, { type: 'fogata', s: 250 }], [/pileta_lona|pileta_de_lona/, { type: 'pileta', s: 190 }], [/banera/, { type: 'banera', s: 170 }], [/changuito|carrito/, { type: 'changuito', s: 300 }], [/yaguarete|jaguar/, { type: 'animal', kind: 'yaguarete', s: 250 }], [/perro/, { type: 'animal', kind: 'perro', s: 160 }],
  [/bolsas|arpillera/, { type: 'bolsas', s: 240 }], [/^camion$/, { type: 'camion', s: 190 }], [/^auto$/, { type: 'auto', s: 200 }], [/colectivo/, { type: 'colectivo', s: 180 }], [/^heladera$/, { type: 'heladera', s: 520 }], [/jarra/, { type: 'jarra', s: 260 }], [/enredadera/, { type: 'calabaza_planta', s: 620 }]];
const hashN = (s, n) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % n; };
const INDOOR = /casa|cocina|home|living|oficina|office|bar|caf|escuela|school|aula|cuarto|room|mesa|colectivo|bus|tren|auto/i;
function sceneShot(v, si) {
  // new places get the closest existing look, new roles a stable look of their own
  const place = PLACE[v.place] || placeOf2(v.place); const ppl = (v.people || []).slice(0, 6); const L = layout(Math.max(1, ppl.length), place);
  const people = ppl.map((pp, i) => { const r = roleOf(pp.role, i); const sc = r.scale || 1; delete r.scale; const dk = norm(pp.does); let d = DOES[dk] || {}; if (!DOES[dk] && dk.startsWith('hold_')) { const it = dk.slice(5); d = ITEMS2.includes(it) ? { item: it } : { hold: 'mate' }; }
    const pos = L[i]; const o = { ...r, ...d, x: pos.x, y: pos.y, s: Math.round(pos.s * sc), back: pos.back };
    if (pp.mood) o.face = FACE2[norm(pp.mood)] || pp.mood; if (dk === 'spit') o.face = 'disgusted'; if (pp.termo && o.hold === 'mate') o.hold = 'both'; if (dk === 'drink' && pp.termo) o.hold = 'termo'; if (pp.mate) o.mate = { mate_madera: 'madera' }[pp.mate] || pp.mate; if (pos.x > 0.55 && ppl.length === 2) o.flip = true; if (d.hold === 'mate' || d.hold === 'both' || pp.does === 'drink') o.steam = true; return o; });
  if (ppl.length === 1 && ppl[0].does === 'drink') { people[0].s = 900; people[0].y = place === 'kitchen' ? 0.92 : 0.95; }
  const p = { scene: place, people }; if (/noche|night/.test(norm(v.place))) p.time = 'night';
  // seats for people who sit, props behind the figures
  const objs = []; const sitters = people.filter(q => q.sit); if (sitters.length && place !== 'living') { const xs = sitters.map(q => q.x), x0 = Math.min(...xs), x1 = Math.max(...xs); objs.push({ type: 'banco', x: (x0 + x1) / 2, y: sitters[0].y + 0.005, s: Math.round(((x1 - x0) * 1080 + 300) / 2), back: true, delay: 0 }); }
  { const seen = {}; const ky = (L[0] ? L[0].y : 0.82) - 0.035; (v.props || []).forEach(q0 => { const name = norm(typeof q0 === 'string' ? q0 : q0.type); const hit = PROPS2.find(([re]) => re.test(name)); if (!hit) return; const t = hit[1].type + (hit[1].kind || ''); if ((place === 'ruta' && hit[1].type === 'camion') || (place === 'galpon' && hit[1].type === 'bolsas')) return;
      seen[t] = (seen[t] || 0) + 1; if (seen[t] > 2) return; const n = objs.filter(o => !o.seat).length; objs.push({ ...hit[1], x: seen[t] === 2 ? 0.2 : [0.84, 0.16, 0.5][n % 3], y: ky, back: true, delay: 0 }); }); }
  if (objs.length) p.objs = objs;
  if (place === 'kitchen') { const f0 = people.filter(q => !q.back)[0] || people[0]; p.tableY = f0 ? +(f0.y - 0.34 * f0.s / 1920).toFixed(3) : 0.62; } // counter at hip height (the figures have short cartoon legs: hip at ~1/3 of the height)
  if (v.pass && people[v.pass[0]] && people[v.pass[1]]) { p.pass = { from: v.pass[0], to: v.pass[1] }; const A = people[v.pass[0]], B = people[v.pass[1]]; A.act = 'pass'; delete A.item; if (B.act === 'receive') delete B.act;
    // hand to hand: the two stand close enough that their hands meet, and face each other
    if (A && B && Math.abs(A.x - B.x) > 0.32) { const m = (A.x + B.x) / 2, dir = Math.sign(B.x - A.x) || 1; A.x = +(m - dir * 0.16).toFixed(3); B.x = +(m + dir * 0.16).toFixed(3); }
    if (A && B) { A.flip = B.x < A.x; B.flip = A.x < B.x; } }
  if (v.time) p.time = v.time;
  if (v.label && people[v.label.on || 0]) { const on = people[v.label.on || 0]; const headY = on.y - on.s * 0.92 / 1920; p.labels = [{ text: v.label.text, x: on.x, y: headY, ty: Math.max(0.3, headY - 0.08) }]; }
  return { tpl: 'flat', p };
}
// one thing to show: its drawing type and size (null = no drawing yet -> name card)
const MATE2 = { mate: 'calabaza', mate_madera: 'madera', madera: 'madera', imperial: 'imperial', acero: 'acero', mate_acero: 'acero' };
const CUT2 = { corte_polvo_arriba: { dust: 'top' }, corte_polvo_abajo: { dust: 'bottom' }, corte_un_costado_mojado: { wet: true }, corte_interior: { pores: true }, zoom_poros: { pores: true }, nivel_tres_cuartos: { animate: 'nivel_tres_cuartos' }, yerba_se_hincha: { animate: 'yerba_se_hincha' } };
const THING2 = { termo: ['termo', 680], yerba: ['yerba', 520], bombilla: ['bombilla', 760], bombillas: ['bombilla', 760], pava: ['pava', 620], kettle: ['pava', 620], yerba_con_palo: ['heap', 520, 'con_palo'], yerba_sin_palo: ['heap', 520, 'sin_palo'], yerba_brasil: ['heap', 520, 'brasil'],
  rama_yerba: ['rama', 760], hoja_yerba: ['hoja', 700], planta_yerba: ['planta', 720], calabaza_planta: ['calabaza_planta', 760], tacuapi: ['tacuapi', 780], cuia: ['cuia', 520], guampa: ['guampa', 560], jarra_con_hielo: ['jarra', 560], bolsa_nylon_yerba: ['bolsa', 520], heladera: ['heladera', 820],
  termo_abollado: ['termo_var', 680, 'abollado'], mano_con_polvo: ['mano', 520], celular: ['celular', 560], facturas: ['facturas', 420], azucarera: ['azucarera', 480], bizcochitos: ['bizcochitos', 520], matera: ['matera', 420], termometro: ['termometro', 640], auto: ['auto', 300], camioneta: ['auto', 300], colectivo: ['colectivo', 260], camion: ['camion', 260] };
function thing2(v) { const it = norm(v.item || 'mate'); const an = norm(v.animate), va = norm(v.variant);
  if (MATE2[it]) { if (CUT2[an] && MATE2[it] === 'calabaza') return { type: 'matecut', s: 640, ...CUT2[an] }; return { type: MATE2[it], s: 640, steam: true, mate: true }; }
  if (it === 'termo' && va) return { type: 'termo_var', s: 680, kind: 'calcomanias' }; const t = THING2[it]; if (!t) return null; const o = { type: t[0], s: t[1] }; if (t[2]) o.kind = t[2]; if (an) o.animate = an; return o; }
function objectShot(v, si) {
  const main0 = thing2(v); if (!main0) return boardShot({ type: 'title', text: String(v.item).replace(/_/g, ' ').toUpperCase(), sub: v.labels && v.labels[0] }); // a new object is named on a card until it has its own drawing (never a mate in disguise)
  const objs = []; const solo = !(v.with && v.with.length); const type = main0.type; const isMate = !!main0.mate; delete main0.mate;
  const main = { ...main0, x: solo ? 0.5 : 0.62, y: 0.7, s: solo ? main0.s : Math.round(main0.s * 0.75), bob: !!v.mascot };
  if (v.mascot && isMate) main.face = FACE2[norm(v.mascot)] || (['happy', 'smile', 'surprised', 'sad', 'angry', 'love', 'laugh'].includes(v.mascot) ? v.mascot : 'surprised'); objs.push(main);
  (v.with || []).forEach((w, i) => { const t = thing2({ item: w }) || { type: 'calabaza', s: 640 }; delete t.mate; objs.push({ ...t, x: 0.22, y: 0.78, s: Math.round(t.s * 0.75), delay: 0.15 + i * 0.1 }); });
  const p = { scene: v.bg ? 'solid' : 'navygrid', bg: BG[v.bg] || v.bg || NAVY, objs };
  const anchors = { calabaza: [[0.58, 0.39, 0.74, 0.3], [0.4, 0.6, 0.27, 0.5]], termo: [[0.5, 0.42, 0.72, 0.33], [0.5, 0.62, 0.28, 0.56]] };
  if (v.labels) p.labels = v.labels.map((t, i) => { const a = (anchors[type] || anchors.calabaza)[i % 2]; return { text: t, x: a[0], y: a[1], tx: a[2], ty: a[3] }; });
  if (v.mascot && v.heart) objs.push({ type: 'heart', x: 0.74, y: 0.36, s: 160, delay: 0.4 });
  return { tpl: 'flat', p };
}
// two things side by side with their names
function compareShot(v) { const a = thing2(v.left || {}), b = thing2(v.right || {}); if (!a || !b) return null; delete a.mate; delete b.mate; const objs = [{ ...a, x: 0.27, y: 0.72, s: Math.round(a.s * 0.62) }, { ...b, x: 0.73, y: 0.72, s: Math.round(b.s * 0.62), delay: 0.2 }];
  const labels = [[v.left, 0.27], [v.right, 0.73]].filter(q => q[0] && q[0].label).map(([q, x]) => ({ text: q.label, x, y: 0.74, tx: x, ty: 0.8 })); return { tpl: 'flat', p: { scene: 'navygrid', bg: NAVY, objs, labels } }; }
function mapShot(v) { return { tpl: 'flat', p: { scene: 'navygrid', bg: NAVY, objs: [{ type: 'map', x: 0.5, y: 0.86, s: 980, countries: v.countries, text: v.text, sub: v.sub }] } }; }
function reactionShot(v, si, st) { const bg = BG[v.color] || v.color || REACT_COLORS[si % REACT_COLORS.length]; const sc = st && st.scene && !v.color ? { scene: st.scene, table: false, ...(st.time ? { time: st.time } : {}), ...(st.tableY ? { tableY: st.tableY } : {}) } : { scene: 'solid' }; // reactions stand in the place of the story, not on an empty colour
  return { tpl: 'flat', p: { ...sc, bg, people: [{ who: v.who ?? (si % 6), x: 0.5, y: 1.34, s: 1500, act: { teeth: null, burn_tongue: 'shock' }[v.act] !== undefined ? { teeth: null, burn_tongue: 'shock' }[v.act] : (v.act || (v.emotion === 'surprised' ? 'shock' : null)), face: v.act === 'teeth' ? 'disgusted' : v.act === 'burn_tongue' ? 'pain' : (FACE2[norm(v.emotion)] || v.emotion || 'surprised') }] } }; }
function boardShot(v, st) { const b = { bg: NAVY }; if (st && st.scene) { b.scene = st.scene; if (st.time) b.time = st.time; if (st.tableY) b.tableY = st.tableY; }
  if (v.type === 'title') return { tpl: 'board', p: { ...b, kind: 'title', text: v.text, sub: v.sub } };
  if (v.type === 'number') return { tpl: 'board', p: { ...b, kind: 'title', text: v.value, sub: v.sub } };
  if (v.type === 'list') return { tpl: 'board', p: { ...b, kind: 'cards', items: v.items.map((it, i) => ({ n: it.n ?? i + 1, title: it.title, sub: it.sub, ok: it.ok })) } };
  if (v.type === 'checklist') return { tpl: 'board', p: { ...b, kind: 'checklist', rows: v.rows } };
  if (v.type === 'dots') return { tpl: 'board', p: { ...b, kind: 'dots', total: v.total || 100, on: v.on, cols: v.cols || 10, label: v.label, sub: v.sub } };
  if (v.type === 'timeline') return { tpl: 'board', p: { ...b, kind: 'timeline', items: v.items } };
  return null; }
// 2D camera plans: push in, pull out, pan, sudden punch-in, tight second angle (centre = the head of the focus figure)
const CAMS2 = ['push', 'panR', 'pull', 'snap', 'panL', 'still'];
function cam2(kind, fp) { const c = fp ? [fp.x, fp.y - 0.62 * fp.s / 1920] : [0.5, 0.55]; const mid = [0.5, 0.55];
  if (kind === 'push') return { z0: 1.06, z1: 1.3, c0: mid, c1: c }; if (kind === 'pull') return { z0: 1.38, z1: 1.08, c0: c, c1: mid }; if (kind === 'panR') return { z0: 1.22, z1: 1.22, c0: [0.36, 0.56], c1: [0.64, 0.56] }; if (kind === 'panL') return { z0: 1.22, z1: 1.22, c0: [0.64, 0.56], c1: [0.36, 0.56] };
  if (kind === 'snap') return { z0: 1.06, z1: 1.5, c0: mid, c1: c, snap: 0.42 }; if (kind === 'tight') return { z0: 1.55, z1: 1.68, c0: c, c1: c }; return null; }
function shotFor(v, si, st) {
  if (!v) return boardShot({ type: 'title', text: '' }, st);
  if (v.type === 'scene') { const sh = sceneShot(v, si); if (st) { st.scene = sh.p.scene; st.time = sh.p.time; st.tableY = sh.p.tableY; } return sh; } if (v.type === 'object') return onScene(objectShot(v, si), st); if (v.type === 'reaction') return reactionShot(v, si, st);
  if (v.type === 'compare') { const c = compareShot(v); if (c) return onScene(c, st); } if (v.type === 'map') return onScene(mapShot(v), st);
  if (v.type === 'mistake') { const sh = sceneShot(v.over || { type: 'scene', place: 'kitchen', people: [{ role: 'friend', does: 'no' }] }, si); if (st) { st.scene = sh.p.scene; st.time = sh.p.time; st.tableY = sh.p.tableY; } return sh; }
  return boardShot(v, st) || boardShot({ type: 'title', text: v.text || '', sub: v.sub }, st); }
const onScene = (s, st) => { if (s && s.tpl === 'flat' && s.p && s.p.scene === 'navygrid' && st && st.scene) { s.p.scene = st.scene; s.p.veil = 0.5; s.p.table = false; if (st.time) s.p.time = st.time; } return s; }; // visual kinds no style draws yet (compare, map ...) show their text as a card
const AT = text => { const w = text.replace(/[¿¡]/g, '').split(/\s+/).map(x => x.replace(/[^\p{L}]/gu, '')).filter(x => x.length > 3 && !/^\d/.test(x)); const pick = (w[1] || w[0] || '').toLowerCase(); const cut = pick.search(/[^a-zñ]/); return (cut > 1 ? pick.slice(0, cut) : pick).slice(0, 5); };
// --- variety (2026-11-17, reel 0014 "termo bajo el brazo": 13 s of the same street, 14 s of dark text screens) ---
const ITEM_HINTS = [[/colectivo|bondi|bus/, { place: 'ruta', props: ['colectivo'] }], [/cancha|futbol|partido/, { place: 'plaza', props: ['pelota'] }], [/banco/, { place: 'park', props: ['banco'] }],
  [/manej|auto|ruta|viaje/, { place: 'ruta', does: 'drive' }], [/perro/, { place: 'park', props: ['perro'], does: 'walk' }], [/cochecito|bebe/, { place: 'plaza', props: ['cochecito'], does: 'walk' }],
  [/oficina|trabajo/, { place: 'oficina' }], [/playa|mar|rio/, { place: 'playa' }], [/cocina|casa/, { place: 'cocina' }], [/super|almacen/, { place: 'supermercado' }], [/facultad|escuela|clase/, { place: 'oficina' }]];
const sceneKey = v => v && v.type === 'scene' ? norm(v.place) + '|' + (v.people || []).map(q => q.role).join(',') : null;
function vary(script) { const j = JSON.parse(JSON.stringify(script)); let prevKey = null, prevMain = null;
  j.segments.forEach((sg, si) => { const vis = sg.visuals || (sg.visual ? [sg.visual] : []); if (vis.length !== 1) { prevKey = sceneKey(vis[vis.length - 1]); return; } const v = vis[0];
    if (v.type === 'scene') { const items = String(sg.text).split(/,|\sy\s|:/).map(x => norm(x)).filter(x => x.length > 2); const hits = items.map(it => (ITEM_HINTS.find(([re]) => re.test(it)) || [])[1]).filter(Boolean);
      const distinct = [...new Map(hits.map(h => [h.place + (h.props || []).join(), h])).values()];
      if (distinct.length >= 2) { sg.visuals = distinct.slice(0, 3).map(h => ({ ...JSON.parse(JSON.stringify(v)), instant: true, place: h.place, props: [...(v.props || []).filter(p => !(h.props || []).includes(p)), ...(h.props || [])], people: (v.people || []).slice(0, 2).map((q, k) => k === 0 && h.does ? { ...q, does: h.does } : q) })); delete sg.visual; prevKey = sceneKey(sg.visuals[sg.visuals.length - 1]); return; }
      const key = sceneKey(v); if (key && key === prevKey && String(sg.text).split(/\s+/).length >= 6 && (v.people || []).length) { sg.visuals = [v, { type: 'reaction', emotion: (v.people[0].mood || 'happy'), act: 'nod', who: 0 }]; delete sg.visual; }
      prevKey = key; prevMain = v; return; }
    prevKey = null; });
  // the ending (no poll): the people of the reel instead of a dark title card, the title becomes a big headline
  const last = j.segments[j.segments.length - 1], lv = last && (last.visuals || [last.visual])[0]; const lastScene = [...j.segments].reverse().map(g => (g.visuals || [g.visual]).find(v => v && v.type === 'scene')).find(Boolean);
  if (!j.poll && lv && lv.type === 'title' && lastScene) { last.visual = { ...JSON.parse(JSON.stringify(lastScene)), people: (lastScene.people || []).map(q => ({ ...q, does: 'cheer', mood: 'happy' })) }; delete last.visuals; if (lv.text) { last.headline = last.headline || String(lv.text).toUpperCase(); last.headlineAt = last.headlineAt || AT(last.text); } }
  return j; }
function toSpec(script, opt = {}) { script = vary(script); // opt.plain: one shot per visual and no 2D camera (toy3d builds on this and swaps the pictures)
  const st = {}; let lastCam = null, ck = hashN(script.id || 'reel', 97); const nextCam = () => { let c; do { c = CAMS2[ck++ % CAMS2.length]; } while (c === lastCam); lastCam = c; return c; };
  const firstScene = script.segments.map(g => g.visuals || [g.visual]).flat().find(v => v && v.type === 'scene'); if (firstScene) { const s0 = sceneShot(firstScene, 0); st.scene = s0.p.scene; st.time = s0.p.time; st.tableY = s0.p.tableY; }
  const segs = script.segments.map((sg, si) => {
    const vis = sg.visuals || [sg.visual]; let shots = vis.map((v, k) => { const s = shotFor(v, si, opt.plain ? null : st); if (k % 2 === 1) s.zoom = 1.12; if (v && v.instant && s.p && s.p.people) s.p.people.forEach(q => { q.delay = 0; }); return s; });
    if (!opt.plain) { const out = []; shots.forEach((s, k) => { const v = vis[k]; const isScene = v && (v.type === 'scene' || v.type === 'mistake') && s.tpl === 'flat' && (s.p.people || []).length; if (!isScene) return out.push(s);
        const ppl = s.p.people, busy = ppl.findIndex(q => q.act === 'pour' || q.act === 'drink'), fi = busy >= 0 ? busy : s.p.pass ? s.p.pass.from : 0, fp = ppl[fi]; const words = String(sg.text || '').split(/\s+/).length; const kind = si === 0 ? 'push' : nextCam(); const cam = cam2(kind, fp); if (cam) s.p.cam = cam; out.push(s);
        if (vis.length === 1 && words >= 10 && !s.p.pass && ppl.length > 1 && !(v.type === 'mistake')) { const t2 = JSON.parse(JSON.stringify(s)); t2.p.cam = cam2('tight', fp); t2.p.people.forEach(q => { q.delay = 0; }); out.push(t2); } }); shots = out; }
    const callouts = [];
    if (sg.headline) { const at = sg.headlineAt || AT(sg.text); const t = sg.headlineType || 'big'; callouts.push({ type: t, text: sg.headline, at, ...(sg.impact ? { impact: true } : {}), ...(sg.headlineSub ? { sub: sg.headlineSub } : {}) }); }
    if (sg.visual && sg.visual.type === 'mistake') callouts.push({ type: 'xmark', text: sg.visual.text, at: sg.visual.at || AT(sg.text), y: 820, size: 300 });
    // comments: the question of the poll is already asked early (second sentence), not only at the end
    if (script.poll && si === 1 && (script.poll.options || []).length) callouts.push({ type: 'pill', text: '¿VOS QUÉ DECÍS?', y: 1400, early: true }); // low, so it never meets the headline or the caption line at the top
    if (!opt.plain) { const textual = shots.length && shots.every(sh => sh.tpl === 'board'); for (let i = callouts.length - 1; i >= 0; i--) if (textual && callouts[i].type === 'big') callouts.splice(i, 1); const heads = callouts.filter(c => c.type === 'big').map(c => norm(c.text)); shots.forEach(sh => { if (sh.p && sh.p.labels) sh.p.labels = sh.p.labels.filter(l => !heads.includes(norm(l.text))); }); }
    return { text: sg.text, say: sg.say, emo: sg.emo || 'neutral', shots, callouts };
  });
  if (script.poll) { const last = segs[segs.length - 1]; last.shots = [{ tpl: 'board', p: { kind: 'poll', bg: NAVY, question: script.poll.question, options: script.poll.options, top: 600, cta: false, ...(!opt.plain && st.scene ? { scene: st.scene, time: st.time, tableY: st.tableY } : {}) } }]; last.callouts = []; }
  return { id: script.id, topic: script.topic, preset: 'flat2d', ab: script.ab || 'style flat2d', segments: segs, caption: script.caption, hashtags: script.hashtags,
    ...(script.followSub ? { followSub: script.followSub } : {}) };
}
module.exports = { name: 'flat2d', toSpec };
