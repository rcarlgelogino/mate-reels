// Generator for docs/examples/0041s_ep1_tapado.json: serial "Primera visita", episode 1 "El mate tapado" (3D patio, vote MUEVO / AVISO).
// Run: node docs/examples/0041s_ep1_tapado.js   (directions: 0041s_directions/N.md, one "## <shot>" section per shot)
const fs = require('fs'), path = require('path');
const shotsOf = n => fs.readFileSync(path.join(__dirname, '0041s_directions', n + '.md'), 'utf8').split(/^## /m).filter(x => x.trim()).map(x => '## ' + x.trim());
const rad = d => d * Math.PI / 180, at = (r, deg) => ({ x: +(r * Math.sin(rad(deg))).toFixed(3), z: +(r * Math.cos(rad(deg))).toFixed(3) });
const RS = 0.95, RW = 1.38; const SEAT = { vos: 165, abuela: 118, novia: 212, cunado: 268 };
const seat = id => at(RS, SEAT[id]); const seats = Object.keys(SEAT).map(seat);
const toCenter = id => SEAT[id] - 180; // camera angle in front of a seated person (they face the table centre)
const SU = at(RW, 193); const suFront = 13; // the camera sees the suegro through the gap between Tomás and Caro // the suegro stands behind Tomás' right shoulder
const suToVos = +(Math.atan2(seat('vos').x - SU.x, seat('vos').z - SU.z) * 180 / Math.PI).toFixed(1); // camera angle in front of the suegro when he faces Tomás
const look = {
  vos: { skin: '#f6d7bb', hair: '#3a2416', hairStyle: 'short', shirt: '#8fc3ea', pants: '#d8c39a' },
  suegro: { skin: '#f2c9a4', hair: '#6b5a4a', hairStyle: 'short', hat: 'boina', hatColor: '#2b2b2b', mustache: true, shirt: '#a8323a', pants: '#6f7682', termo: '#2f9e44' },
  abuela: { skin: '#f3cba6', hair: '#cfcfcf', hairStyle: 'bun', glasses: true, shirt: '#7c5a9e', dress: '#8a8f96', pants: '#8a8f96' },
  novia: { skin: '#f6d7bb', hair: '#3a2416', hairStyle: 'ponytail', shirt: '#f2c53d', pants: '#3b5b9a' },
  cunado: { skin: '#f1c6a0', hair: '#2a1a10', hairStyle: 'curly', shirt: '#2f9e44', pants: '#2b2f3a' }
};
const LAP = { L: [-45, -235], R: [45, -235] }, MATE_CHEST = [40, -300], PHONE_UP = [100, -330];
const sitter = (id, k0 = {}, extra = []) => ({ id, look: look[id], keys: [{ u: 0, px: seat(id).x, pz: seat(id).z, faceTo: 'center', sit: true, s: id === 'abuela' ? 500 : 520, face: 'neutral', look: 'vos', ...k0 }, ...extra] });
const vos = (k0 = {}, extra = []) => sitter('vos', { hold: 'mate', R: MATE_CHEST, L: LAP.L, look: 'cam', face: 'worried', ...k0 }, extra);
const suegro = (k0 = {}, extra = []) => ({ id: 'suegro', look: look.suegro, keys: [{ u: 0, px: SU.x, pz: SU.z, faceTo: 'vos', hold: 'termo', L: [-40, -230], R: [60, -250], face: 'neutral', look: 'vos', ...k0 }, ...extra] });
const cunado = (k0 = {}, extra = []) => sitter('cunado', { R: PHONE_UP, face: 'sly', ...k0 }, extra);
const phone = [{ id: 'phone', kind: 'phone', keys: [{ u: 0, at: 'cunado.R', ry: -Math.PI / 2, dy: -60 }] }];
const ring = o => [suegro(...(o.suegro || [])), vos(...(o.vos || [])), sitter('abuela', ...(o.abuela || [])), sitter('novia', ...(o.novia || [])), cunado(...(o.cunado || []))];
const shot = (o) => ({ world: 'patio', light: 'sun', seats, props: phone, fx: [], sounds: [], ...o });

const S = []; // segments: [text, emo, [ [f, anim], ... ]]
// 1 — hook
S.push(['Episodio uno: primera vez en lo de tu novia, y el mate está tapado.', 'tense', [
  [1.2, shot({ people: ring({ vos: [{ suck: true, face: 'suck', look: null }], suegro: [{ face: 'sly', look: 'vos' }] }),
    cam3: [{ u: 0, on: 'vos.head', a: toCenter('vos') + 4, r: 3.2, h: -0.1, ax: -0.3, ay: 0.2, az: 0 }, { u: 1, r: 2.8, dur: 1 }],
    sounds: [{ u: 0.02, type: 'suck' }, { u: 0.5, type: 'suck' }] })],
  [1, shot({ people: ring({ vos: [{ suck: true, face: 'suck', look: 'center' }], cunado: [{ R: LAP.R, face: 'neutral' }, [{ u: 0.3, R: PHONE_UP, face: 'sly' }]], abuela: [{ face: 'confused', L: [-20, -360] }], novia: [{ face: 'smile' }, [{ u: 0.6, face: 'worried' }]] }), dogUp: 0.5,
    cam3: [{ u: 0, a: -4, r: 5.0, h: 2.9, ax: -0.05, ay: 0.85, az: -0.45 }, { u: 1, a: 4, r: 4.3, h: 2.5, dur: 1 }],
    sounds: [{ u: 0.3, type: 'beep' }, { u: 0.6, type: 'tick' }] })],
  [0.9, shot({ people: ring({ vos: [{ suck: true, face: 'suck', look: 'abuela' }, [{ u: 0.5, look: 'novia' }, { u: 0.8, look: 'suegro', face: 'worried', suck: false }]] }),
    fx: [{ kind: 'sweat', u0: 0.15, u1: 1, at: 'vos.head' }],
    cam3: [{ u: 0, on: 'vos.head', a: toCenter('vos') + 8, r: 1.9, h: 0, ax: 0, ay: 0.02, az: 0 }, { u: 1, r: 1.7, dur: 1 }],
    sounds: [{ u: 0.5, type: 'tick' }] })]]]);
// 2 — If: suck harder
S.push(['Si chupás más fuerte, no sale nada.', 'tense', [
  [1.1, shot({ people: ring({ vos: [{ suck: true, face: 'suck', look: null, bow: 0 }, [{ u: 0.35, bow: 0.25, dur: 0.15, L: [-60, -250] }]] }),
    cam3: [{ u: 0, on: 'vos.head', a: toCenter('vos') + 15, r: 2.4, h: 0, ax: 0, ay: -0.08, az: 0 }, { u: 0.45, r: 1.9, dur: 0.15 }],
    shake: [{ u0: 0.4, u1: 0.95, a: 2 }], sounds: [{ u: 0.1, type: 'suck' }, { u: 0.45, type: 'suck' }] })],
  [1, shot({ people: ring({ vos: [{ face: 'dizzy', look: null, R: [40, -270], bow: -0.08 }], suegro: [{ face: 'neutral', look: 'vos' }] }),
    fx: [{ kind: 'stars', u0: 0.08, u1: 1, at: 'vos.head' }],
    cam3: [{ u: 0, on: 'vos.head', a: toCenter('vos') + 30, r: 2.6, h: 0.02, ax: -0.15, ay: -0.05, az: 0 }],
    sounds: [{ u: 0.08, type: 'sparkle' }] })]]]);
// 3 — But: move the bombilla
S.push(['Pero si movés la bombilla, el suegro no te lo perdona.', 'tense', [
  [1, shot({ people: ring({ vos: [{ face: 'worried', look: null, R: [40, -300] }, [{ u: 0.25, L: [10, -310], dur: 0.25 }, { u: 0.55, L: 'vos.mate', dur: 0.25, wiggleL: 4 }]] }),
    cam3: [{ u: 0, on: 'vos.mate', a: toCenter('vos') + 10, r: 1.35, h: 0.15, ax: 0, ay: 0.08, az: 0 }],
    sounds: [{ u: 0.5, type: 'tick' }] })],
  [1, shot({ people: ring({ vos: [{ L: 'vos.mate', face: 'worried', look: 'suegro' }], suegro: [{ face: 'angry', look: 'vos' }, [{ u: 0.6, face: 'rage' }]] }),
    cam3: [{ u: 0, on: 'suegro.head', a: suFront, r: 2.3, h: -0.3, ax: 0, ay: 0.02, az: 0 }, { u: 1, r: 1.7, h: -0.2, dur: 1 }],
    sounds: [{ u: 0.6, type: 'buzz' }] })],
  [1, shot({ people: ring({ vos: [{ L: 'vos.mate', face: 'scared', look: 'suegro' }, [{ u: 0.5, L: LAP.L, face: 'worried' }]], suegro: [{ face: 'rage' }], abuela: [{ face: 'shock', L: [-35, -440], R: [35, -440] }], novia: [{ face: 'scared' }], cunado: [{ face: 'sly' }, [{ u: 0.55, face: 'laugh', jump: 0.03 }]] }), dogUp: 0,
    cam3: [{ u: 0, a: 6, r: 4.7, h: 2.1, ax: 0, ay: 0.85, az: -0.35 }, { u: 1, a: 0, r: 4.4, dur: 1 }],
    sounds: [{ u: 0.5, type: 'whoosh' }] })]]]);
// 4 — So: tell him
S.push(['Y si le avisás, quedás como que su mate está mal cebado.', 'tense', [
  [1, shot({ people: ring({ vos: [{ face: 'surprised', look: 'suegro', L: [-40, -440] }], suegro: [{ face: 'neutral', look: 'vos' }] }),
    cam3: [{ u: 0, on: 'vos.head', a: toCenter('vos') + 25, r: 2.6, h: 0.05, ax: -0.25, ay: 0.1, az: 0 }, { u: 1, r: 2.3, dur: 1 }],
    sounds: [{ u: 0.3, type: 'pop' }] })],
  [1.2, shot({ people: ring({ vos: [{ face: 'worried', look: 'suegro' }], suegro: [{ face: 'proud', look: 'vos', bow: -0.15, L: [-70, -290], nod: 0.12 }] }),
    cam3: [{ u: 0, on: 'suegro.head', a: suFront + 4, r: 2.3, h: -0.22, ax: 0, ay: -0.05, az: 0 }, { u: 1, r: 2.0, dur: 1 }],
    sounds: [{ u: 0.2, type: 'ding' }] })],
  [0.9, shot({ people: ring({ novia: [{ face: 'scared', look: 'cam', hshake: 0.35 }] }),
    cam3: [{ u: 0, on: 'novia.head', a: toCenter('novia') - 15, r: 1.9, h: 0, ax: 0, ay: -0.03, az: 0 }],
    sounds: [{ u: 0.1, type: 'swish' }] })]]]);
// 5 — the clock: three seconds
const tense = { vos: [{ face: 'scared' }], suegro: [{ face: 'angry' }], abuela: [{ face: 'worried' }], novia: [{ face: 'worried' }], cunado: [{ face: 'sly' }] };
S.push(['Tenés tres segundos: tres, dos, uno.', 'tense', [
  [1.4, shot({ people: ring(tense), dogUp: 0,
    cam3: [{ u: 0, a: 4, r: 5.0, h: 2.6, ax: 0.05, ay: 0.85, az: -0.45 }, { u: 1, r: 3.2, h: 1.9, ax: 0.2, az: -0.8, dur: 1 }],
    sounds: [{ u: 0.2, type: 'tick' }, { u: 0.7, type: 'tick' }] })],
  [0.8, shot({ people: ring(tense), count: [{ u: 0, text: '3', dur: 1 }], fx: [{ kind: 'sweat', u0: 0, u1: 1, at: 'vos.head' }],
    cam3: [{ u: 0, on: 'vos.head', a: toCenter('vos'), r: 2.0, h: 0, ax: 0, ay: 0.22, az: 0 }, { u: 1, r: 1.8, dur: 1 }],
    sounds: [{ u: 0.02, type: 'tick' }] })],
  [0.8, shot({ people: ring({ ...tense, suegro: [{ face: 'rage' }] }), count: [{ u: 0, text: '2', dur: 1 }],
    cam3: [{ u: 0, on: 'suegro.head', a: suFront, r: 2.0, h: -0.25, ax: 0, ay: 0.22, az: 0 }, { u: 1, r: 1.7, dur: 1 }],
    sounds: [{ u: 0.02, type: 'tick' }] })],
  [0.8, shot({ people: ring({ ...tense, cunado: [{ face: 'laugh' }] }), count: [{ u: 0, text: '1', dur: 1 }],
    cam3: [{ u: 0, on: 'cunado.head', a: toCenter('cunado') + 15, r: 1.9, h: 0, ax: 0, ay: 0.22, az: 0 }, { u: 1, r: 1.6, dur: 1 }],
    sounds: [{ u: 0.02, type: 'tick' }] })]]]);
// 6 — freeze + vote
S.push(['¿Qué hacés? Comentá MUEVO o AVISO. El episodio dos sigue a la mayoría.', 'tense', [
  [1, shot({ people: ring({ vos: [{ face: 'shock', look: 'cam' }], suegro: [{ face: 'angry' }] }), fx: [{ kind: 'sweat', u0: 0, u1: 1, at: 'vos.head' }],
    freeze: 0.06, flash: 0.06, vote: { u: 0.1, a: 'MUEVO', b: 'AVISO' },
    cam3: [{ u: 0, on: 'vos.head', a: toCenter('vos') - 6, r: 2.6, h: 0, ax: 0, ay: -0.32, az: 0 }, { u: 0.06, r: 2.3, dur: 0.06 }],
    sounds: [{ u: 0.06, type: 'shutter' }, { u: 0.1, type: 'pop' }] })]]]);

const segments = S.map(([text, emo, list], i) => { const dirs = shotsOf(i + 1); if (dirs.length !== list.length) throw new Error('segment ' + (i + 1) + ': ' + dirs.length + ' directions for ' + list.length + ' shots');
  return { text, emo, shots: list.map(([f, anim], k) => ({ f, direction: dirs[k], anim })) }; });
const j = { id: '0041s_ep1_tapado', series: 'primera-visita', episode: 1, title: 'Primera visita 1: El mate tapado',
  caption: 'Primera visita, episodio 1: el mate está tapado y todos te miran 🧉😰\n¿Qué hacés? Comentá MUEVO o AVISO. El episodio 2 sigue a la mayoría 👇', hashtags: ['#mate', '#suegro', '#argentina', '#humor', '#serie'],
  vote: { options: ['MUEVO', 'AVISO'], rule: 'episode 2 starts with the winner and its consequence' },
  story: { logline: 'On his first visit to his girlfriend\'s family, Tomás gets a clogged mate from her father, the proud cebador: sucking harder gives nothing, moving the bombilla is a sin in the ronda, telling him insults his mate; the family watches, the brother-in-law films, and the viewers decide.',
    timeline: ['One continuous moment, a Sunday about 16:00, sun; the whole episode lasts as long as the voice (no time jumps).'],
    links: ['1: the mate is already clogged when we start (the suegro just served it).', '2: he tries the obvious fix first (suck harder) and fails.', '3: the second fix would work but breaks a ronda rule; the suegro\'s face shows the price.', '4: the third fix (tell him) has a price too: his pride as cebador.', '5: the family waits, the clock runs: the pressure for the viewer.', '6: freeze on the open choice; the vote decides episode 2.'],
    objects: ['mate: full, green, clogged, in Tomás\' right hand the whole time; nobody touches the bombilla.', 'green termo: in the suegro\'s left hand the whole time.', 'phone: in Facu\'s right hand, filming from shot 1b on.'],
    knowledge: ['Everybody at the table sees that the mate does not pull.', 'Nobody says it: that is the joke and the pressure.'],
    places: { patio: 'the family patio (3D world patio); seated: Tomás at the back facing the camera, Nélida to his right, Caro to his left, Facu at the left side; the suegro stands behind Tomás\' right shoulder' } },
  cast: { vos: 'Tomás, 25, short dark hair, light blue shirt, beige trousers', suegro: 'Don Rubén, 58, black boina, moustache, dark red polo, grey trousers, green termo', abuela: 'Nélida, 82, grey bun, round glasses, purple cardigan', novia: 'Caro, 24, dark ponytail, yellow T-shirt, jeans', cunado: 'Facu, 30, curly hair, green football shirt, phone', dog: 'Pancho, light brown, front right' },
  sets: { patio: { desc: 'family patio: brick floor circle, grass, white back wall with bushes, lemon tree, parrilla with smoke, string lights, round table with white cloth, yerba pack and medialunas, four low chairs, the dog', light: 'afternoon sun from the front left' } },
  segments };
fs.writeFileSync(path.join(__dirname, '0041s_ep1_tapado.json'), JSON.stringify(j, null, 2) + '\n'); console.log('written', segments.length, 'segments,', segments.reduce((a, s) => a + s.shots.length, 0), 'shots');
