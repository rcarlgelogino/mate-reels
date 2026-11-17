// Silent build3d reel: a fight in the subway. A preacher with a bible, an annoyed passenger, the guy with the beer who enjoys the show,
// and the abuela who ends it with a mate. Slapstick only (shoving, falling at the brake, stars), no real violence.
// usage: node samples/build3d_subte.js -> work/b3_subte/spec.json ; node pipeline/build.js work/b3_subte/spec.json
const fs = require('fs'), path = require('path');
const PRED = { shirt: '#2b2f3a', hair: 'short', glasses: true, face: 'proud', holds: 'libro' };
const PAS = { shirt: '#2f7fd1', hat: 'cap', hatColor: '#e5483a', face: 'bored' };
const BIRRA = { shirt: '#f2c23a', hat: 'cap', hatColor: '#1f6fb8', mustache: true, face: 'happy', holds: 'lata' };
const ABU = { shirt: '#9a5ac8', hair: 'bun', hairColor: '#cfd2d6', glasses: true, face: 'sleepy' };
const SIT = { pose: 'sit', y: 0.28, z: -0.85, ry: 0 };
const W = 'subte';
const seg = (text, dur, shots, callouts = []) => ({ text, dur, shots: shots.map(p => ({ tpl: 'build', p: { world: W, ...p, dur: p.d || dur / shots.length } })), callouts });
const segments = [
  seg('Subte, hora pico. Todo tranquilo…', 3.5, [
    { cam: 'diorama', lens: 74, people: [{ ...PRED, x: -0.55, z: 0.1 }, { ...PAS, ...SIT, x: 0.45, holds: 'celular' }, { ...BIRRA, ...SIT, x: 1.4 }, { ...ABU, ...SIT, x: -1.45 }] }]),
  seg('Hasta que uno saca la Biblia.', 3.5, [
    { cam: 'push', focus: 'face', who: 0, people: [{ ...PRED, x: 0, z: 0.1, ry: 0 }], acts: [{ who: 0, pose: 'preach', face: 'proud', at: 1.0 }, { fx: 'stars', at: 1.05, from: 'head', who: 0 }] }],
    [{ type: 'big', text: '¡HERMANOS!', at: 'Biblia', rot: -5 }]),
  seg('¡Y se pone a predicar a los gritos!', 3.5, [
    { cam: 'face', who: 0, people: [{ ...PRED, x: 0, z: 0.1, ry: 0, pose: 'preach', face: 'scream', talk: true }], acts: [{ fx: 'spit', t0: 0.4, t1: 3.2, from: 'mouth', who: 0 }] }]),
  seg('Al de al lado no le hace ninguna gracia.', 3.5, [
    { cam: 'face', who: 0, people: [{ ...PAS, ...SIT, x: 0, holds: 'celular', face: 'bored' }], acts: [{ who: 0, face: 'angry', at: 1.2 }, { who: 0, face: 'rage', at: 2.3 }] }]),
  seg('¡Cortala, flaco!', 3, [
    { cam: 'low', people: [{ ...PRED, x: -0.7, z: 0.1, ry: 0.5, pose: 'preach', face: 'outraged', talk: true }, { ...PAS, x: 0.7, z: 0.1, ry: -0.5, pose: 'point', face: 'rage', talk: true }] }],
    [{ type: 'big', text: '¡CORTALA!', at: 'Cortala', color: '#ff3b30', rot: 6 }]),
  seg('Y se arma.', 3.5, [
    { cam: 'orbit', people: [{ ...PRED, holds: null, x: -0.58, z: 0.1, ry: 1.2, pose: 'brawl', face: 'rage' }, { ...PAS, x: 0.58, z: 0.1, ry: -1.2, pose: 'brawl', face: 'rage' }, { ...BIRRA, ...SIT, x: 1.7 }],
      acts: [{ fx: 'stars', at: 1.2, from: 'head', who: 0 }, { fx: 'stars', at: 2.0, from: 'head', who: 1 }, { fx: 'dust', t0: 0.3, t1: 3.2, from: 'feet', who: 0 }, { who: 2, pose: 'laugh', face: 'crylaugh', at: 0.5 }] }],
    [{ type: 'big', text: '¡SE ARMÓ!', at: 'arma', color: '#ff3b30', rot: -6 }]),
  seg('Hasta que el subte frena de golpe.', 3.5, [
    { cam: 'push', brake: 0.9, people: [{ ...PRED, holds: null, x: -0.58, z: 0.1, ry: 1.2, pose: 'brawl', face: 'rage' }, { ...PAS, x: 0.58, z: 0.1, ry: -1.2, pose: 'brawl', face: 'rage' }],
      acts: [{ who: 0, pose: 'shock', face: 'scared', at: 0.9 }, { who: 1, pose: 'shock', face: 'scared', at: 0.9 }, { who: 0, fall: 1.1 }, { who: 1, fall: 1.2 }, { fx: 'dust', at: 1.4, from: 'feet', who: 0 }, { fx: 'stars', at: 1.5, from: 'head', who: 0 }, { fx: 'stars', at: 1.6, from: 'head', who: 1 }, { who: 0, face: 'dizzy', at: 1.7 }, { who: 1, face: 'dizzy', at: 1.8 }] }],
    [{ type: 'big', text: '¡FRENADA!', at: 'frena', rot: 4 }]),
  seg('El de la birra no se pierde nada.', 4, [
    { cam: 'push', focus: 'face', who: 0, people: [{ ...BIRRA, ...SIT, x: 0, pose: 'drink' }], acts: [{ who: 0, pose: 'laugh', face: 'crylaugh', at: 2.0 }] }]),
  seg('Y la abuela del fondo saca el termo.', 4, [
    { cam: 'push', focus: 'face', who: 0, people: [{ ...ABU, x: 0, z: 0.1, ry: 0, holds: 'mate', pose: 'present', face: 'sly' }], acts: [{ who: 0, face: 'wink', at: 1.6 }, { fx: 'hearts', at: 1.7, from: 'head', who: 0 }] }],
    [{ type: 'big', text: 'MATE', at: 'termo' }]),
  seg('Fin de la pelea. Mate para todos.', 5, [
    { cam: 'diorama', lens: 74, people: [{ ...PRED, holds: 'mate', ...SIT, x: -0.5, pose: 'drink' }, { ...PAS, ...SIT, x: 0.45, pose: 'cheer', face: 'laugh' }, { ...BIRRA, ...SIT, x: 1.35, pose: 'cheer', face: 'laugh' }, { ...ABU, x: -1.35, z: 0.35, ry: 0.35, pose: 'present', face: 'proud', holds: 'termo' }],
      acts: [{ fx: 'confetti', t0: 1.0, t1: 3.6, pos: [0, 2.2, 0] }, { who: 0, pose: 'cheer', face: 'starstruck', at: 2.4 }] }],
    [{ type: 'big', text: 'PAZ', at: 'Fin' }]) ];
const spec = { id: 'b3_subte', topic: 'pelea en el subte (build3d, silent)', preset: 'build3d', silent: true, follow: false, segments, caption: 'Pelea en el subte… y la abuela la termina con un mate 🧉', hashtags: ['#subte', '#humor', '#mate'] };
const dir = path.join(__dirname, '..', 'work', 'b3_subte'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(spec, null, 1)); console.log('ok', segments.reduce((a, s) => a + s.dur, 0), 's');
