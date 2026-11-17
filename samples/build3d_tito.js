// Silent build3d example after the wemakebuild comparison (docs/WATCHTIME.md section 12):
// one named hero (Tito) + a friend, a big object he carries, rides and falls out of, failure gags that hit the person,
// chase/follow cameras with a 0.5x-like wide lens instead of cut-cut-cut, the object evolving in place.
// usage: node samples/build3d_tito.js -> work/b3_tito/spec.json ; node pipeline/build.js work/b3_tito/spec.json
const fs = require('fs'), path = require('path');
const TITO = { shirt: '#e5483a', hat: 'boina', mustache: true, face: 'happy' }, ANA = { shirt: '#2f9e44', hair: 'long', face: 'happy' };
const seg = (text, dur, shots, callouts = []) => ({ text, dur, shots: shots.map(p => ({ tpl: 'build', p: { ...p, dur: p.d || dur / shots.length } })), callouts });
const G = (st, o = {}) => ({ obj: 'calabaza', st, table: false, ...o });
const segments = [
  seg('Tito encontró la calabaza más grande del campo', 4, [
    { cam: 'follow', who: 0, stage: G('entera', { size: 0.8 }), people: [{ ...TITO, x: -2.2, z: 0.4 }], acts: [{ who: 0, walk: [-2.2, 0.6], t0: 0, t1: 3.2 }, { who: 0, carry: [0, 4] }, { who: 0, face: 'proud', at: 0 }, { fx: 'dust', t0: 0, t1: 3.2, from: 'feet', who: 0 }] }]),
  seg('Primer intento: ¿y si la usamos de auto?', 4.5, [
    { cam: 'chase', who: 0, stage: G('vacia', { size: 1.6 }), people: [{ ...TITO }, { ...ANA, x: -1.6, z: 0.3, pose: 'push' }], acts: [{ slide: [0, 5, 0.6, 4.4], ease: 'in' }, { who: 0, ride: true, rideY: 0.22, face: 'laugh' }, { who: 1, walk: [-1.6, -0.7], t0: 0.3, t1: 1.2, run: true, then: 'cheer' }, { who: 1, face: 'laugh', at: 0.3 }, { fx: 'dust', t0: 0.8, t1: 4.4, from: 'bottom' }] }],
    [{ type: 'big', text: '¡A TODA VELOCIDAD!', at: 'auto', rot: -5 }]),
  seg('¡PLAF! Tito sale volando', 4, [
    { cam: 'low', stage: G('vacia', { size: 1.6 }), people: [{ ...TITO }], acts: [{ slide: [-1.5, 0.4, 0, 0.6] }, { who: 0, ride: true, rideY: 0.22, face: 'scared' }, { who: 0, launch: 0.6, to: [2.6, 0.9], h: 2.2, spins: 1, dur: 1.0, land: 'dizzy' }, { fx: 'stars', at: 1.7, from: 'head', who: 0 }, { fx: 'dust', at: 1.6, pos: [2.6, 0.1, 0.9] }] }],
    [{ type: 'big', text: '¡PLAF!', at: 'PLAF', color: '#ff3b30', rot: 8 }]),
  seg('Ana se ríe. Tito no.', 3, [
    { cam: 'face', who: 0, people: [{ ...TITO, x: 0, ry: 0, pose: 'idle', face: 'dizzy' }] },
    { cam: 'face', who: 0, people: [{ ...ANA, x: 0, ry: 0, pose: 'laugh', face: 'crylaugh' }] }]),
  seg('Segundo intento: la cortás arriba', 4, [
    { cam: 'diorama', stage: G('cortada', { capOn: true, size: 1.4 }), people: [{ ...TITO, pose: 'saw', face: 'rage', x: -0.75, z: 0.2 }], acts: [{ shake: [0.2, 1.8] }, { capoff: 1.9 }, { fx: 'shards', at: 1.9 }, { who: 0, fall: 2.1 }, { fx: 'stars', at: 2.3, from: 'head', who: 0 }] }],
    [{ type: 'big', text: '¡CRAC!', at: 'arriba', color: '#ff3b30', rot: -8 }]),
  seg('Adentro: mil semillas', 3.5, [
    { cam: 'push', stage: G('vacia', { size: 1.1 }), people: [{ ...ANA, pose: 'saw', face: 'disgusted', x: -0.7, z: 0.2 }], acts: [{ fx: 'seeds', t0: 0.2, t1: 3.3 }] }]),
  seg('Un mes al sol… con Tito adentro', 4, [
    { cam: 'orbit', stage: G('seca', { size: 1.6 }), people: [{ ...TITO }], acts: [{ who: 0, ride: true, rideY: 0.15, pose: 'idle', face: 'sleepy' }, { color: ['#c8b45a', '#b8803a', 0.3, 3.6] }, { timelapse: [0, 3.9], turns: 3 }] }],
    [{ type: 'big', text: 'SECADO', at: 'sol' }]),
  seg('Lo prueba sin curar. ¡Amarguísimo!', 4, [
    { cam: 'face', who: 0, people: [{ ...TITO, pose: 'drink', holds: 'mate', x: 0, ry: 0 }], acts: [{ who: 0, pose: 'shock', face: 'crazy', at: 1.6 }, { fx: 'spit', at: 1.65, from: 'mouth', who: 0 }] }],
    [{ type: 'big', text: '¡AMARGO!', at: 'Amargu', color: '#ff3b30', rot: 6 }]),
  seg('Ana la cura con yerba y agua a setenta y cinco grados', 4.5, [
    { cam: 'diorama', stage: G('mate', { size: 0.9 }), people: [{ ...ANA, pose: 'idle', face: 'proud', x: 0.75, ry: -0.5 }], acts: [{ fill: [0.2, 1.0] }, { insert: [1.0, 1.5] }, { fx: 'pour', who: 0, t0: 1.6, t1: 3.9 }, { fx: 'steam', t0: 2.3, t1: 4.4 }] }],
    [{ type: 'big', text: '75°', at: 'setenta' }]),
  seg('Y ahora sí, el primer mate es de Tito', 4.5, [
    { cam: 'push', focus: 'face', who: 0, people: [{ ...TITO, pose: 'drink', holds: 'mate', x: 0, ry: 0 }], acts: [{ who: 0, face: 'starstruck', at: 1.8 }, { fx: 'hearts', at: 1.8, from: 'head', who: 0 }] },
    { cam: 'low', people: [{ ...TITO, pose: 'cheer', face: 'laugh', x: -0.7, ry: 0.25 }, { ...ANA, x: 3, ry: -0.25 }], acts: [{ who: 1, walk: [3, 0.7], t0: 0, t1: 0.7, run: true, then: 'cheer' }, { who: 1, face: 'laugh', at: 0.7 }, { fx: 'confetti', t0: 0.4, t1: 2.2, pos: [0, 1.5, 0.3] }] }]) ];
const spec = { id: 'b3_tito', topic: 'Tito y la calabaza gigante (build3d, silent)', preset: 'build3d', silent: true, follow: false, segments, caption: 'Tito quiso hacer un mate con la calabaza más grande del campo 🧉', hashtags: ['#mate', '#animacion'] };
const dir = path.join(__dirname, '..', 'work', 'b3_tito'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(spec, null, 1)); console.log('ok', segments.reduce((a, s) => a + s.dur, 0), 's');
