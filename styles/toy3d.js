// toy3d style translator: style-neutral script (docs/SCRIPT.md) -> render spec for the sunny 3D meadow (template prado).
// Text, headlines, callouts, boards and the poll are taken 1:1 from flat2d, so an A/B pair differs only in the pictures.
// The camera is chosen here: 14 set-ups and 15 moves, never the same twice in a row, long sentences get a cut in the middle.
const flat2d = require('./flat2d');
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const ROLE = { cebador: { who: 0, shirt: '#e5483a', hair: 'short' }, friend: { who: 1, shirt: '#2f6fd0', hair: 'side' }, stranger: { who: 2, shirt: '#f2a922', hair: 'bob' }, you: { who: 3, shirt: '#2f9e6e', hair: 'short' },
  grandma: { who: 4, shirt: '#8a4fd0', hair: 'bun', hairColor: '#c9c2b8', glasses: true }, grandpa: { who: 5, shirt: '#2f6b8a', hair: 'short', hairColor: '#c9c2b8', glasses: true, mustache: true },
  kid: { who: 2, scale: 0.72, shirt: '#ef7a3a', hair: 'side', hat: 'cap', hatColor: '#2f6fd0' }, worker: { who: 1, shirt: '#f08a24', hair: 'short', hat: 'hardhat' },
  // nations: the flag is printed on the shirt
  argentino: { who: 0, shirt: '#8cc4ee', flag: 'ar', hair: 'short' }, uruguayo: { who: 1, shirt: '#f4f6f8', flag: 'uy', hair: 'side' }, paraguayo: { who: 2, shirt: '#d43a3a', flag: 'py', hair: 'short' },
  brasileno: { who: 3, shirt: '#f6c800', pants: '#1f8a3b', flag: 'br', hair: 'side' }, chileno: { who: 4, shirt: '#1f3f8f', flag: 'cl', hair: 'short' }, aleman: { who: 5, shirt: '#2b2b2b', flag: 'de', hair: 'side', glasses: true },
  // more characters
  gaucho: { who: 0, shirt: '#e9dfc8', pants: '#5a4636', hat: 'boina', hatColor: '#2b2b2b', scarf: '#d43a3a', mustache: true }, oficinista: { who: 1, shirt: '#f4f6f8', pants: '#34425a', tie: '#c0392b', hair: 'side' },
  estudiante: { who: 2, shirt: '#3fa7a0', backpack: '#e5483a', hair: 'long' }, turista: { who: 3, shirt: '#ff8a5a', hat: 'cap', hatColor: '#f4f6f8', camera: true },
  // family, office, history and legend
  suegra: { who: 4, shirt: '#c2507a', hair: 'bob', hairColor: '#b9b2a8', necklace: '#f4efe6', apron: '#f4efe6' }, suegro: { who: 5, shirt: '#5a6b4a', hair: 'short', hairColor: '#c9c2b8', mustache: true, glasses: true }, novia: { who: 2, shirt: '#ef6f9a', hair: 'long' },
  cunado: { who: 3, shirt: '#ef7a3a', hair: 'short', hat: 'cap', hatColor: '#2b2b2b' }, companera: { who: 2, shirt: '#3fa7a0', hair: 'long', necklace: '#f2c230' }, companero_vivo: { who: 1, shirt: '#8a4fd0', hair: 'side', shades: true },
  jefe: { who: 5, shirt: '#2b3442', pants: '#1f2630', hair: 'short', tie: '#c0392b', glasses: true }, guarani: { who: 0, shirt: '#b5713a', pants: '#8a5a36', hair: 'long', band: '#d43a3a', feather: '#2f9e6e', necklace: '#f2c230' },
  anciano_guarani: { who: 5, shirt: '#b5713a', pants: '#8a5a36', hair: 'long', hairColor: '#c9c2b8', band: '#d43a3a', feather: '#f2c230' }, yasy_luna: { who: 1, shirt: '#eef4ff', pants: '#dfe9ff', glow: '#eaf2ff', hair: 'long', hairColor: '#eef1f6', moon: true },
  tarefero: { who: 3, shirt: '#c98a4a', pants: '#5a4636', hat: 'sombrero', hatColor: '#e3cf9a', scarf: '#2f6fd0' }, yuyera: { who: 4, shirt: '#2f9e6e', hair: 'bun', headscarf: '#f2a922', apron: '#f4efe6' }, abuela: null, abuelo: null };
const ALIAS = { abuela: 'grandma', abuelo: 'grandpa', amigo: 'friend', amiga: 'friend', nino: 'kid', nina: 'kid', chico: 'kid', obrero: 'worker', trabajador: 'worker', argentina: 'argentino', uruguaya: 'uruguayo', paraguaya: 'paraguayo',
  brasilero: 'brasileno', brasilera: 'brasileno', brasilena: 'brasileno', brasileiro: 'brasileno', chilena: 'chileno', alemana: 'aleman', german: 'aleman', student: 'estudiante', tourist: 'turista', office: 'oficinista', oficina: 'oficinista', companero: 'oficinista', cunada: 'novia', suegros: 'suegro', guaranies: 'guarani', yasy: 'yasy_luna', luna: 'yasy_luna', anciano: 'anciano_guarani', vendedora: 'yuyera', yerbatero: 'tarefero', cosechero: 'tarefero' };
const ITEMS = ['celular', 'facturas', 'azucarera', 'bizcochitos', 'matera', 'termometro']; const BOMB = ['recta', 'curva', 'pico_loro', 'resorte', 'paleta', 'cana', 'alpaca']; const CARS = ['auto', 'camioneta', 'colectivo'];
const DOES = { idle: {}, hold_mate: { hold: 'mate' }, hold_termo: { hold: 'termo' }, hold_both: { hold: 'both' }, hold_yerba: { hold: 'yerba' }, hold_pava: { hold: 'pava' }, hold_bombilla: { hold: 'bombilla', item: 'recta' },
  drink: { hold: 'mate', act: 'drink' }, pour: { hold: 'both', act: 'pour' }, pass: { hold: 'mate' }, receive: { gest: 'receive' }, offer: { hold: 'mate', gest: 'offer' },
  think: { gest: 'think' }, point: { gest: 'point' }, shrug: { gest: 'shrug' }, talk: { gest: 'talk' }, whisper: { gest: 'whisper' }, type: { gest: 'talk' }, defend: { gest: 'point' }, reach_bombilla: { gest: 'point' }, grind_mortar: { gest: 'talk' }, harvest: { gest: 'point' },
  sit: { sit: true }, sit_phone: { sit: true, hold: 'item', item: 'celular', gest: 'phone' }, sit_hold_both: { sit: true, hold: 'both' }, film_phone: { hold: 'item', item: 'celular', gest: 'offer' },
  carry_termo_brazo: { hold: 'termo_brazo' }, carry_all: { hold: 'termo_brazo' }, hold_cuia: { hold: 'mate', mate: 'cuia' }, hold_guampa: { hold: 'mate', mate: 'guampa' }, blow_mate: { hold: 'mate', gest: 'blow' }, shake_mate: { hold: 'mate', gest: 'shake' },
  empty_mate: { hold: 'mate', gest: 'shake' }, wash_mate: { hold: 'mate', gest: 'shake' }, rinse_mate: { hold: 'mate', gest: 'shake' }, shake_bombilla: { hold: 'bombilla', item: 'recta', gest: 'shake' }, hug_mate: { hold: 'mate', face: 'love' }, scrape_spoon: { hold: 'mate' },
  drink_tapado: { hold: 'mate', act: 'drink' }, drink_sin_bombilla: { hold: 'mate', act: 'drink' }, spit: { hold: 'mate', face: 'disgusted' }, fill_yerba: { hold: 'yerba' }, use_pava_electrica: { hold: 'pava' },
  pour_cold_water: { hold: 'both', act: 'pour' }, pour_from_olla: { hold: 'both', act: 'pour' }, pour_lukewarm: { hold: 'both', act: 'pour' }, pour_fast: { hold: 'both', act: 'pour' } };
const GEST = ['think', 'point', 'shrug', 'talk', 'whisper'];
const ACTS = ['wave', 'cheer', 'jump', 'no', 'nod', 'shock', 'laugh', 'sigh', 'hug']; // whole-body actions, played by the engine on top of the pose
const FACE = { neutral: 'neutral', smile: 'smile', happy: 'happy', surprised: 'surprised', sad: 'sad', angry: 'angry', proud: 'proud', love: 'love', laugh: 'laugh', excited: 'happy', outraged: 'outraged', bored: 'bored', worried: 'worried', disgusted: 'disgusted', pain: 'pain', confused: 'confused', dizzy: 'confused', preocupado: 'worried', asco: 'disgusted', dolor: 'pain',
  // Spanish and German words work too
  sonriente: 'smile', feliz: 'happy', enojado: 'angry', sauer: 'angry', indignado: 'outraged', empoert: 'outraged', aburrido: 'bored', gelangweilt: 'bored', triste: 'sad', traurig: 'sad', sorprendido: 'surprised', orgulloso: 'proud' };
const MATES = { mate_madera: 'madera', madera: 'madera', imperial: 'imperial', acero: 'acero', mate_acero: 'acero' };
const hashN = (s, n) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % n; };
const SHIRTS = ['#e5483a', '#2f6fd0', '#f2a922', '#2f9e6e', '#8a4fd0', '#ef7a3a', '#2f6b8a', '#d94f8a'];
// new roles (any character the story needs) get a stable look of their own
function look(role) { const k = norm(role); const r = ROLE[k] || ROLE[ALIAS[k]]; if (r) return { ...r };
  return role ? { who: hashN(k, 6), shirt: SHIRTS[hashN(k + '#', SHIRTS.length)], hair: ['short', 'side', 'bob', 'bun', 'long'][hashN(k + '~', 5)] } : null; }
function person(pp, i) { const d = norm(pp.does); let does = DOES[d] || {}; if (!DOES[d] && d.startsWith('hold_')) { const it = d.slice(5); does = ITEMS.includes(it) ? { hold: 'item', item: it } : BOMB.includes(it) ? { hold: 'bombilla', item: it } : { hold: 'mate' }; }
  const o = { ...(look(pp.role) || { who: i }), ...does }; if (pp.mood) o.face = FACE[norm(pp.mood)] || 'smile'; if (pp.termo && o.hold === 'mate') o.hold = 'both'; if (pp.mate && MATES[pp.mate]) o.mate = MATES[pp.mate]; return o; }

// ---- camera choice ----
const SOLO = ['close', 'sideL', 'orbitL', 'face', 'low', 'dollyR', 'pushin', 'sideR', 'high', 'craneUp', 'dutch', 'orbitR', 'dollyL', 'lowpush', 'pullout'];
const SOLO_HOLD = ['close', 'hands', 'sideL', 'tiltUp', 'orbitL', 'low', 'top', 'pushin', 'sideR', 'dollyR', 'tiltDown', 'high', 'craneUp', 'orbitR', 'face', 'dutch', 'dollyL', 'lowpush'];
const GROUP = ['wide', 'flow', 'pan', 'widelow', 'far', 'arcTop', 'pullout']; // only plans that keep the whole group in the picture
const REACT = ['face', 'crash', 'pushin', 'low', 'dutch', 'sideL', 'sideR', 'lowpush'];
const HERO = ['orbitL', 'pushin', 'high', 'tiltUp', 'orbitR', 'sideL', 'arcTop', 'low', 'close', 'craneUp', 'hands', 'dollyR'];
const DRINK = ['pushin', 'close', 'sideR', 'low', 'orbitL', 'face']; const POUR = ['hands', 'close', 'top', 'sideL', 'craneDown', 'high'];
function chooser(seed) { const used = {}; let last = null, k = hashN(seed, 97);
  return (pool, avoid) => { let best = null, bs = 1e9; pool.forEach((c, i) => { if (c === last || c === avoid) return; const sc = (used[c] || 0) * 100 + ((i + k) % pool.length); if (sc < bs) { bs = sc; best = c; } });
    best = best || pool[0]; used[best] = (used[best] || 0) + 1; last = best; k += 7; return best; }; }
// place names (any language, any wording) -> one of the built 3D places; unknown outdoor places stay on the meadow
const PLACES = [[/supermercado|^super|gondola|almacen|chino/, 'super'], [/mercado|feria|puesto/, 'mercado'], [/living|sala|sillon|suegr/, 'living'], [/selva|monte|jungla|choza|aldea/, 'selva'], [/yerbal|plantacion|cosecha|misiones|tarefa/, 'yerbal'],
  [/galpon|secadero|fabrica|molino|deposito|planta_/, 'galpon'], [/bano|ducha/, 'bano'], [/ruta|carretera|viaje|camino/, 'ruta'], [/cocina|kitchen|casa|home|hogar|comedor|desayuno/, 'cocina'], [/oficina|office|trabajo|laburo|escritorio|reunion/, 'oficina'],
  [/plaza|ciudad|city|calle|street|centro|barrio|parada|colectivo|vereda|kiosco/, 'plaza'], [/patio|asado|parrilla|quincho|jardin|fondo|terraza|balcon|huerta/, 'patio'], [/playa|beach|costa|mar|rio|costanera|rambla|verano|vacaciones/, 'playa']];
const placeOf = name => { const k = norm(name); const hit = PLACES.find(([re]) => re.test(k)); return hit ? hit[1] : 'prado'; }; const INDOOR = ['cocina', 'oficina', 'living', 'super', 'galpon', 'bano'];
// props a script names (any wording) -> built props; what a place already has is not added twice
const PROPS = [[/fogata|fuego/, 'fogata'], [/pileta_lona|pileta_de_lona/, 'pileta_lona'], [/banera/, 'banera'], [/changuito|carrito/, 'changuito'], [/yaguarete|jaguar/, 'yaguarete'], [/perro/, 'perro'], [/paloma/, 'palomas'], [/bolsas|arpillera/, 'bolsas'], [/sombrilla/, 'sombrilla'],
  [/heladerita/, 'heladerita'], [/reposera/, 'reposera'], [/enredadera/, 'enredadera'], [/^choza/, 'choza'], [/puesto|mortero/, 'puesto'], [/^camion$/, 'camion'], [/^auto$/, 'auto'], [/camioneta/, 'camioneta'], [/colectivo/, 'colectivo'], [/^mesa$/, 'mesa'], [/^heladera$/, 'heladera'], [/jarra/, 'jarra']];
const PLACE_PROPS = [[/calle|auto|estacion/, ['auto']], [/colectivo|bus|parada|bondi/, [{ type: 'colectivo', drive: true }]], [/picnic|asado/, ['mesa']], [/camioneta|campo|estancia/, ['camioneta']], [/huerta/, ['enredadera']], [/ruta|carretera|viaje/, [{ type: 'camion', drive: true }]]];
const HAS = { playa: ['sombrilla', 'reposera'], living: ['sofa'], patio: ['mesa'], mercado: ['puesto'], galpon: ['bolsas'], selva: ['choza'], cocina: ['heladera'] };
function propsFor(v, place) { const out = [], seen = {}; const push = q => { const t = typeof q === 'string' ? q : q.type; if ((HAS[place] || []).includes(t)) return; if (INDOOR.includes(place) && ['auto', 'camioneta', 'colectivo', 'camion', 'mesa', 'pileta_lona', 'sombrilla', 'choza', 'puesto', 'enredadera'].includes(t)) return; seen[t] = (seen[t] || 0) + 1; if (seen[t] > (t === 'banera' ? 2 : 1)) return; out.push(q); };
  (v.props || []).forEach(q0 => { const name = norm(typeof q0 === 'string' ? q0 : q0.type); const hit = PROPS.find(([re]) => re.test(name)); if (hit) push(typeof q0 === 'object' && q0.drive ? { type: hit[1], drive: true } : hit[1]); });
  PLACE_PROPS.filter(([re]) => re.test(norm(v.place))).forEach(q => q[1].forEach(push)); return out; }
function sceneShots(v, si, pick, words, st) {
  const src = (v.people || []).slice(0, 6); const people = src.map(person); if (!people.length && !(v.props || []).length) people.push({ who: 0, hold: 'mate' });
  const acts = src.map(pp => ACTS.includes(norm(pp.does)) ? norm(pp.does) : null); const n = people.length; const busy = people.findIndex(p => p.act); const focus = v.focus ?? (busy >= 0 ? busy : v.pass ? v.pass[0] : 0);
  const place = placeOf(v.place); st.place = place; st.night = /noche|night/.test(norm(v.place)); const props = propsFor(v, place);
  const base = { people, focus, place }; if (props.length) base.props = props; if (st.night) base.night = true;
  const emo = acts.some(Boolean) ? { act: acts.find(Boolean), who: acts.map((a, k) => a ? k : -1).filter(k => k >= 0) } : null;
  const handover = v.pass && people[v.pass[0]] && people[v.pass[1]] && ['mate', 'both', 'termo_brazo'].includes(people[v.pass[0]].hold) ? [v.pass[0], v.pass[1]] : null; if (handover) { base.pass = handover; delete people[handover[0]].gest; delete people[handover[1]].gest; }
  const act = busy >= 0 ? people[busy].act : handover ? 'pass' : null; const holds = !!(people[focus] && people[focus].hold);
  const solo = act === 'pass' ? (n === 2 ? ['duo', 'wide', 'widelow'] : ['wide', 'widelow', 'far']) : act === 'drink' ? DRINK : act === 'pour' ? POUR : holds ? SOLO_HOLD : SOLO; const group = n === 2 ? GROUP.concat(['duo', 'ots']) : GROUP;
  const mk = cam => { const p = { ...base, shot: cam }; if ((cam === 'duo' || cam === 'ots') && !handover) { const o = focus === 0 ? 1 : 0; p.pair = [focus, o]; if (cam === 'ots') p.turnK = 1; } const sh = { tpl: 'prado', p }; if (emo) sh.emo = emo; return sh; };
  if (v.camera) return [mk(v.camera)];
  const first = pick(n === 0 ? ['wide', 'far', 'pan', 'widelow'] : n <= 1 || act ? solo : si === 0 ? ['flow', 'crash', 'pushin'] : group);
  // a long sentence gets a second angle (never while someone drinks or pours: the action would start again)
  if (words >= 9 && !act && n > 0) return [mk(first), mk(pick(n <= 1 ? solo : (holds ? SOLO_HOLD : SOLO).filter(c => !['top', 'hands', 'tiltUp', 'tiltDown'].includes(c) || holds), first))];
  return [mk(first)];
}
function reactionShot(v, si, pick, st) { const who = v.who ?? (si % 6); const base = Object.values(ROLE).find(r => r && r.who === who && !r.flag && !r.hat) || { who }; const pp = { ...base, face: FACE[norm(v.emotion)] || 'surprised' }; delete pp.scale;
  const a0 = norm(v.act); if (GEST.includes(a0)) pp.gest = a0; if (a0 === 'teeth') pp.face = 'disgusted'; if (a0 === 'burn_tongue') pp.face = 'pain';
  const sh = { tpl: 'prado', p: { people: [pp], shot: v.camera || pick(REACT), focus: 0, place: st.place, ...(st.night ? { night: true } : {}) } }; const act = ACTS.includes(a0) ? a0 : a0 === 'burn_tongue' ? 'shock' : (!a0 && v.emotion === 'surprised' ? 'shock' : null); if (act) sh.emo = { act, face: pp.face }; return sh; }
// object visuals: the thing itself, big on a small table (unknown things fall back to the name card of flat2d)
const HEROES = ['cuia', 'guampa', 'termo', 'termo_abollado', 'yerba', 'yerba_con_palo', 'yerba_sin_palo', 'yerba_brasil', 'pava', 'tacuapi', 'rama_yerba', 'hoja_yerba', 'planta_yerba', 'calabaza_planta', 'jarra_con_hielo', 'bolsa_nylon_yerba', 'heladera', 'mano_con_polvo'];
function heroOf(v) { const it = norm(v.item || 'mate'); let hero = null;
  if (it === 'mate' || MATES[it]) hero = { item: 'mate', type: MATES[it] || 'calabaza', face: v.mascot ? 'smile' : null };
  else if (it === 'kettle') hero = { item: 'pava' }; else if (it === 'bombilla' || it === 'bombillas') hero = v.kind ? { item: 'bombilla', kind: norm(v.kind) } : { item: 'bombillas', kinds: v.kinds };
  else if (BOMB.includes(it) || BOMB.includes(it.replace(/^bombilla_/, ''))) hero = { item: 'bombilla', kind: it.replace(/^bombilla_/, '') };
  else if (HEROES.includes(it) || ITEMS.includes(it) || CARS.includes(it)) hero = { item: it };
  if (hero) { if (v.variant) hero.variant = norm(v.variant); if (v.animate) hero.animate = norm(v.animate); if (v.label) hero.label = v.label; } return hero; }
const SIGN = ['close', 'sideL', 'dollyR', 'low', 'sideR', 'dollyL', 'craneUp', 'high'], COMPARE = ['wide', 'pan', 'widelow'];
function objectShot(v, pick, st) { const hero = heroOf(v); return hero ? { tpl: 'prado', p: { hero, shot: v.camera || pick(HERO), place: st.place, ...(st.night ? { night: true } : {}) } } : null; }
function compareShot(v, pick, st) { const a = heroOf(v.left || {}), b = heroOf(v.right || {}); if (!a || !b) return null; a.label = (v.left || {}).label; b.label = (v.right || {}).label; return { tpl: 'prado', p: { compare: [a, b], shot: v.camera || pick(COMPARE), place: st.place, ...(st.night ? { night: true } : {}) } }; }
// text cards and maps stand as a sign inside the 3D world instead of a dark 2D card
function signShot(sign, pick, st, v) { return { tpl: 'prado', p: { sign, shot: (v && v.camera) || pick(SIGN), place: st.place, ...(st.night ? { night: true } : {}) } }; }
function toSpec(script) {
  const base = flat2d.toSpec(script); const pick = chooser(script.id || 'reel'); const st = { place: placeOf((script.segments.map(g => (g.visuals || [g.visual])).flat().find(v => v && v.type === 'scene') || {}).place) }; // reactions and objects stay in the place of the scene before them
  base.segments.forEach((seg, si) => { const sg = script.segments[si]; const vis = sg.visuals || [sg.visual]; const words = String(sg.text || '').split(/\s+/).filter(Boolean).length;
    if (script.poll && si === script.segments.length - 1) return; // poll board stays
    const out = []; seg.shots.forEach((s, k) => { const v = vis[k]; if (!v) return out.push(s);
      if (v.type === 'scene') return out.push(...sceneShots(v, si, pick, vis.length > 1 ? 0 : words, st)); if (v.type === 'reaction') return out.push(reactionShot(v, si, pick, st)); if (v.type === 'object') return out.push(objectShot(v, pick, st) || s);
      if (v.type === 'compare') return out.push(compareShot(v, pick, st) || (v.text ? signShot({ kind: 'text', text: v.text, sub: v.sub }, pick, st, v) : s));
      if (v.type === 'map') return out.push(signShot({ kind: 'map', countries: v.countries, text: v.text, sub: v.sub }, pick, st, v));
      if (v.type === 'title' && v.text) return out.push(signShot({ kind: 'text', text: v.text, sub: v.sub }, pick, st, v)); if (v.type === 'number' && v.value) return out.push(signShot({ kind: 'text', text: String(v.value), sub: v.sub }, pick, st, v));
      if (v.type === 'mistake') { const sh = sceneShots(v.over || { type: 'scene', people: [{ role: 'friend', does: 'no' }] }, si, pick, 0, st)[0]; sh.emo = { act: 'no' }; return out.push(sh); }
      out.push(s); }); seg.shots = out; });
  return { ...base, preset: 'toy3d', ab: script.ab || 'style toy3d', ...(script.follow === false ? { follow: false } : {}) };
}
module.exports = { name: 'toy3d', toSpec };
