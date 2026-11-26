// "¿Sabías que…?" template: a short topic (JSON) -> a full shooting script for the 3D stage (world "casita").
// Format (docs/research/sabias-que-format.md): normal mate action -> the absurd, very specific alternative or event -> 2-3 real numbers on their words
// (gauge / counter / pill label) -> three losses, each its own destruction beat -> "Seguime para más datos de mate."
// Two kinds: 'recomendable' ("para X lo recomendable es Y y no Z") and 'si' ("si estás tomando mate y pasa Z, ya no podés tomar mate").
// usage: const { toScript } = require('./sabias'); toScript(topic) ; or node scripts/sabias.js topic.json out.json
//
// topic = { id, kind, hook, absurd, agent, agentLabel, facts:[{text, show:'gauge'|'counter'|'label', value, max?, unit?, label}], losses:[3 short words],
//           lossLine, caption, hashtags }
// agents the stage can show: lava (volcano + lava stream), cisterna (water tanker), bomba (atomic bomb), meteorito, tsunami, tornado
const fs = require('fs'), path = require('path');
const AGENTS = ['lava', 'cisterna', 'bomba', 'meteorito', 'tsunami', 'tornado'];
const LOOK = { skin: '#f6d7bb', hair: '#3a2416', hairStyle: 'short', shirt: '#8fc3ea', pants: '#d8c39a' };
const SEAT = { x: 0, z: -0.75 }, LAVA = '#ff5a14';

function toScript(T) {
  if (!AGENTS.includes(T.agent)) throw new Error('unknown agent ' + T.agent);
  const ag = T.agent, isLava = ag === 'lava', isTruck = ag === 'cisterna';
  const tomas = (k0 = {}, extra = []) => ({ id: 'vos', look: LOOK, keys: [{ u: 0, px: SEAT.x, pz: SEAT.z, faceTo: 'center', sit: true, s: 520, hold: 'both', L: [-70, -300], R: [60, -280], face: 'happy', look: 'cam', ...k0 }, ...extra] });
  // the agent's own track (ak: approach 0..1, ab: blast 0..1) per phase
  const agentKeys = phase => ({ before: [{ u: 0, ak: 0, ab: 0 }], arrive: [{ u: 0, ak: 0, ab: 0 }, { u: 0.9, ak: 0.75, ab: 0, dur: 0.9 }], near: [{ u: 0, ak: 0.75, ab: 0 }, { u: 1, ak: 0.9, ab: 0, dur: 1 }], hit: [{ u: 0, ak: 0.9, ab: 0 }, { u: 0.15, ak: 1, ab: 0, dur: 0.15 }, { u: 0.9, ak: 1, ab: 1, dur: 0.75 }], after: [{ u: 0, ak: 1, ab: 1 }] })[phase];
  const world = (phase, o) => ({ world: 'casita', light: 'sun', noTruck: !isTruck, volcano: isLava, agentKind: ['bomba', 'meteorito', 'tsunami', 'tornado'].includes(ag) ? ag : undefined,
    agent: agentKeys(phase), truck: isTruck ? [{ u: 0, tz: phase === 'before' ? 40 : -0.25 }] : undefined, seats: [SEAT], props: [], fx: [], sounds: [], ...o });
  const agentAnchor = isLava ? 'crater' : isTruck ? 'valve' : 'agent', agentLabelAt = isLava ? 'crater' : isTruck ? [-4.75, 3.1, -0.9] : 'agent.label';
  const agentCam = isLava ? [{ u: 0, a: 28, r: 15, h: 5, ax: 0, ay: 2.5, az: -9 }, { u: 1, a: 22, r: 19, h: 7, ay: 4, dur: 1 }]
    : isTruck ? [{ u: 0, a: -42, r: 12.5, h: 4.4, ax: -2.6, ay: 1.2, az: -0.6 }, { u: 1, r: 11.5, dur: 1 }]
    : ag === 'tsunami' ? [{ u: 0, a: 160, r: 9, h: 3, ax: 0, ay: 4, az: -2 }, { u: 1, r: 11, h: 4, dur: 1 }]
    : ag === 'bomba' ? [{ u: 0, a: 12, r: 22, h: 3, ax: 0, ay: 8, az: -1 }, { u: 1, r: 20, ay: 6, dur: 1 }]
    : [{ u: 0, a: 12, r: 16, h: 2.5, ax: 0, ay: 6, az: -3 }, { u: 1, r: 18, h: 3, ay: 8, dur: 1 }];
  const S = []; const say = (text, emo, ...shots) => S.push({ text, emo, shots });
  // 1 — the normal moment
  say(T.hook, 'neutral', { f: 1, direction: 'Dollhouse kitchen in the sun: Tomás at the table pours water from the green termo into his gourd, calm and happy.',
    anim: world('before', { people: [tomas({}, [{ u: 0.2, pour: 0.6, dur: 0.12 }, { u: 0.85, pour: 0, dur: 0.1 }])], fx: [{ kind: 'stream', u0: 0.25, u1: 0.85, at: 'vos.spout', to: 'vos.mate', color: '#cfeeff', w: 7 }],
      labels: T.kind === 'recomendable' && T.normalLabel ? [{ u0: 0.4, text: T.normalLabel, at: 'vos.spout', dy: -70 }] : [],
      cam3: [{ u: 0, a: 6, r: 4.6, h: 2.6, ax: 0, ay: 0.7, az: -0.6 }, { u: 1, r: 4.0, h: 2.3, dur: 1 }], sounds: [{ u: 0.25, type: 'pour' }, { u: 0.4, type: 'lib:pop_1' }] }) });
  // 2 — the absurd thing arrives
  say(T.absurd, 'surprised', { f: 1.1, direction: 'Wide: the absurd thing (' + ag + ') appears next to the tiny house, at its true size. Label ' + T.agentLabel + '.',
    anim: world('arrive', { people: [tomas({ face: 'surprised', look: 'center' })], labels: [{ u0: 0.3, text: T.agentLabel, at: agentLabelAt, dy: -40, big: true }],
      cam3: agentCam, sounds: [{ u: 0.05, type: isTruck ? 'lib:police_radio_beep_1' : 'lib:whoosh_2' }, { u: 0.3, type: 'lib:vine_boom_1', gain: 0.8 }] }) });
  // 3.. — the facts, one per segment, alternating between the thing and Tomás
  (T.facts || []).slice(0, 3).forEach((F, i) => {
    const onThing = i % 2 === 0; const show = {};
    if (F.show === 'gauge') show.gauge = { u0: 0.12, to: F.value, max: F.max || Math.ceil(F.value * 1.15), unit: F.unit ? ' ' + F.unit : '' };
    else if (F.show === 'counter') show.counter = { u0: 0.1, u1: 0.75, from: 0, to: F.value, unit: F.unit || '', label: F.label };
    else show.labels = [{ u0: 0.2, text: F.label, at: onThing ? agentLabelAt : 'vos.head', dy: onThing ? -40 : -170, big: true }];
    say(F.text, i === 2 ? 'excited' : 'neutral', { f: 1, direction: 'Fact ' + (i + 1) + ': ' + F.text + ' Shown as ' + F.show + '.',
      anim: world('near', { people: [tomas({ face: ['worried', 'shock', 'scared'][i], look: 'center', ...(isLava ? { termoColor: LAVA } : {}) })], ...show,
        fx: i === 1 ? [{ kind: 'sweat', u0: 0.2, u1: 1, at: 'vos.head' }] : [],
        cam3: onThing ? (isLava ? [{ u: 0, on: 'crater', a: 20, r: 16, h: 3, ax: 0, ay: 0, az: 0 }, { u: 1, r: 13, dur: 1 }] : agentCam) : [{ u: 0, on: 'vos.head', a: 0, r: 2.6, h: 0, ax: 0, ay: -0.2, az: 0 }],
        sounds: [{ u: 0.12, type: F.show === 'counter' ? 'lib:cash_3' : F.show === 'gauge' ? 'lib:charge_1' : 'lib:pop_2', gain: 0.6 }, { u: 0.75, type: F.show === 'counter' ? 'lib:coin_2' : 'lib:tik_tik_1' }] }) });
  });
  // the consequence: three losses (1 = what is in the mate, 2 = the bombilla, 3 = the big thing)
  const L = T.losses.map(x => 'SIN ' + String(x).toUpperCase());
  const big = ag === 'tsunami' || isTruck ? [{ kind: 'flood', u0: 0.12, u1: 0.7, hold: 1, h: 0.5, w: 8, d: 7, x: 0, z: -0.4 }] : isLava ? [{ kind: 'burst', u0: 0.15, u1: 1, at: [0, 0.3, -2.3], n: 60, speed: 3, secs: 1.8, colors: ['#ff5a14', '#ffb02a', '#2b2b2b'], dir: [0, 2, 1] }] : [];
  say(T.lossLine, 'funny',
    { f: 1, direction: 'The first loss: the contents of the gourd explode out. Label ' + L[0] + '.',
      anim: world('hit', { people: [tomas({ face: 'shock', look: 'center' }, [{ u: 0.3, mateEmpty: true }])], flash: ag === 'bomba' ? 0.15 : undefined,
        fx: [{ kind: 'burst', u0: 0.25, u1: 1, at: 'vos.mate', n: 80, speed: 1.6, secs: 1.4, colors: isLava || ag === 'bomba' ? ['#2b2b2b', '#ff5a14', '#ffb02a'] : ['#6fae3a', '#4f8a2a', '#8fc24a'], dir: [0, 1.4, 0.5] }],
        labels: [{ u0: 0.3, text: L[0], at: 'vos.head', dy: -150 }], shake: [{ u0: 0.15, u1: 0.5, a: 4 }],
        cam3: [{ u: 0, on: 'vos.head', a: 0, r: 2.4, h: 0.1, ax: 0, ay: -0.15, az: 0 }], sounds: [{ u: 0.15, type: ag === 'bomba' || ag === 'meteorito' ? 'lib:boom_3' : 'lib:explosion_2', gain: 0.8 }] }) },
    { f: 0.8, direction: 'The second loss: the bombilla shoots out of the gourd like a rocket. Label ' + L[1] + '.',
      anim: world('after', { people: [tomas({ face: 'surprised', look: null, mateEmpty: true }, [{ u: 0.1, mateNoBomb: true }])], fx: [{ kind: 'rocket', u0: 0.1, u1: 1, at: 'vos.mate', h: 9 }],
        labels: [{ u0: 0.25, text: L[1], xy: [520, 700] }], cam3: [{ u: 0, a: 4, r: 5.5, h: 1.3, ax: 0, ay: 1.4, az: -0.6 }, { u: 1, ay: 4.5, h: 2.0, dur: 1 }],
        sounds: [{ u: 0.1, type: 'lib:whoosh_5' }, { u: 0.75, type: 'lib:metal_pipe_1', gain: 0.5 }] }) },
    { f: 1.2, direction: 'The third loss: the walls break into blocks and fly away. Label ' + L[2] + '.',
      anim: world('after', { breakAt: 0.12, people: [tomas({ face: 'dizzy', look: null, mateEmpty: true, mateNoBomb: true })],
        fx: [{ kind: 'debris', u0: 0.12, u1: 1, at: [-2.3, 0.2, -0.9], n: 46, speed: 4, dir: [3, 1, 0], spread: [0.3, 2.2, 3.6], secs: 2.2 }, { kind: 'debris', u0: 0.15, u1: 1, at: [0, 0.2, -2.3], n: 30, speed: 3, dir: [0, 1, -2], spread: [4.4, 2.2, 0.3], secs: 2.2 }, ...big],
        labels: [{ u0: 0.3, text: L[2], xy: [520, 760], big: true }], shake: [{ u0: 0.12, u1: 0.4, a: 5 }],
        cam3: [{ u: 0, a: 15, r: 6.5, h: 3.4, ax: -0.5, ay: 0.6, az: -0.6 }, { u: 1, r: 7.5, h: 4, dur: 1 }],
        sounds: [{ u: 0.12, type: 'lib:lego_breaking_1' }, { u: 0.13, type: 'lib:boom_2', gain: 0.8 }, { u: 0.3, type: 'lib:glass_crack_1', gain: 0.6 }] }) });
  say('Seguime para más datos de mate.', 'funny', { f: 1, direction: 'Tomás sits in the ruin, the empty gourd in his hand, the three labels around him. Slow push-in.',
    anim: world('after', { breakAt: 0, people: [tomas({ face: 'confused', look: 'cam', mateEmpty: true, mateNoBomb: true })], fx: [...big.filter(b => b.kind === 'flood').map(b => ({ ...b, u0: 0, u1: 0.01 }))],
      labels: [{ u0: 0.05, text: L[0], at: 'vos.head', dy: -230 }, { u0: 0.12, text: L[1], at: 'vos.L', dy: 40 }, { u0: 0.19, text: L[2], at: 'vos.R', dy: 120 }],
      cam3: [{ u: 0, on: 'vos.head', a: -6, r: 3.4, h: 0.4, ax: 0, ay: -0.25, az: 0 }, { u: 1, r: 2.8, dur: 1 }],
      sounds: [{ u: 0.02, type: 'lib:record_scratch_1', gain: 0.6 }, { u: 0.6, type: 'lib:bruh_1', gain: 0.7 }] }) });
  return { id: T.id, title: T.title || T.agentLabel, caption: T.caption, hashtags: T.hashtags || ['#mate', '#datoscuriosos', '#argentina', '#humor', '#sabiasque'], thumb: { lines: T.thumb || [T.agentLabel] },
    story: { logline: T.hook + ' ' + T.absurd, facts: (T.facts || []).map(f => f.text + (f.source ? ' (' + f.source + ')' : '')), kind: T.kind, agent: ag }, cast: { vos: 'Tomás, about 25, short dark hair, light blue shirt' }, segments: S };
}
function check(T) { const e = []; if (!['recomendable', 'si'].includes(T.kind)) e.push('kind'); if (!AGENTS.includes(T.agent)) e.push('agent'); for (const k of ['id', 'hook', 'absurd', 'agentLabel', 'lossLine', 'caption']) if (!T[k] || typeof T[k] !== 'string') e.push(k);
  if (!Array.isArray(T.losses) || T.losses.length !== 3) e.push('losses'); if (!Array.isArray(T.facts) || T.facts.length < 2) e.push('facts'); else T.facts.forEach((f, i) => { if (!f.text || !['gauge', 'counter', 'label'].includes(f.show)) e.push('fact' + i); if (f.show !== 'label' && !(typeof f.value === 'number' && f.value > 0)) e.push('fact' + i + '.value'); if (f.show === 'label' && !f.label) e.push('fact' + i + '.label'); });
  return e; }
module.exports = { toScript, check, AGENTS };
if (require.main === module) { const T = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const e = check(T); if (e.length) { console.error('bad topic:', e.join(', ')); process.exit(1); } fs.writeFileSync(process.argv[3], JSON.stringify(toScript(T), null, 1)); console.log('script ->', process.argv[3]); }
