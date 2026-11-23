// Word -> prop table for all styles (2026-11-23): what a sentence names should be in the picture.
// make.js adds the prop to the scene of that sentence in the name the active style draws. Things a style cannot draw yet
// are listed in spec.missing (and in result.json), so the most wanted drawings can be added to that style.
// columns: flat2d (styles/flat2d.js PROPS2), pixel8 (engine pprop), build3d (engine toyPlace SPOT); null = no drawing yet
const LEX = [
  [/\bperr[oa]s?\b|\bcachorro/, 'perro', { flat2d: 'perro', pixel8: 'perro', build3d: 'perro' }],
  [/\bgat[oa]s?\b/, 'gato', { flat2d: null, pixel8: 'gato', build3d: null }],
  [/\bollas?\b/, 'olla', { flat2d: null, pixel8: null, build3d: null }],
  [/\bpileta de la cocina|\bbacha|\bcanilla|\bfregadero/, 'pileta_cocina', { flat2d: 'pileta_cocina', pixel8: 'pileta_cocina', build3d: null }],
  [/\bdetergente/, 'detergente', { flat2d: 'detergente', pixel8: null, build3d: null }],
  [/\besponja/, 'esponja', { flat2d: 'esponja', pixel8: null, build3d: null }],
  [/\btacho|\bbasura/, 'tacho', { flat2d: 'tacho', pixel8: 'tacho', build3d: null }],
  [/\bautos?\b|\bcoche\b/, 'auto', { flat2d: 'auto', pixel8: null, build3d: 'auto' }],
  [/\bcolectivo|\bbondi/, 'colectivo', { flat2d: 'colectivo', pixel8: null, build3d: 'colectivo' }],
  [/\bcami[oó]n/, 'camion', { flat2d: 'camion', pixel8: null, build3d: 'camion' }],
  [/\bheladera\b/, 'heladera', { flat2d: 'heladera', pixel8: null, build3d: 'heladera' }],
  [/\bheladerita|\bconservadora/, 'heladerita', { flat2d: null, pixel8: null, build3d: 'heladerita' }],
  [/\bsombrilla/, 'sombrilla', { flat2d: null, pixel8: 'sombrilla', build3d: 'sombrilla' }],
  [/\breposera/, 'reposera', { flat2d: null, pixel8: 'reposera', build3d: 'reposera' }],
  [/\bfogata|\bfueguito|\bal fuego\b/, 'fogata', { flat2d: 'fogata', pixel8: 'fogata', build3d: 'fogata' }],
  [/\basado\b|\bparrilla/, 'asado', { flat2d: 'asado', pixel8: 'fogata', build3d: 'fogata' }],
  [/\bmesa\b/, 'mesa', { flat2d: null, pixel8: 'mesa', build3d: 'mesa' }],
  [/\bbanco\b|\bbanquito/, 'banco', { flat2d: null, pixel8: 'banco', build3d: 'banco' }],
  [/\bsill[oó]n|\bsof[aá]\b/, 'sofa', { flat2d: null, pixel8: 'sofa', build3d: 'sofa' }],
  [/\bpalomas?\b/, 'palomas', { flat2d: null, pixel8: 'palomas', build3d: 'palomas' }],
  [/\bchanguito|\bcarrito/, 'changuito', { flat2d: 'changuito', pixel8: null, build3d: 'changuito' }],
  [/\bjarra/, 'jarra', { flat2d: 'jarra', pixel8: null, build3d: 'jarra' }],
  [/\bbolsas\b|\barpillera/, 'bolsas', { flat2d: 'bolsas', pixel8: 'bolsas', build3d: 'bolsas' }],
  [/\bhumo\b/, 'humo', { flat2d: null, pixel8: 'humo', build3d: null }],
  [/\bmatafuego|\bextintor/, 'matafuego', { flat2d: null, pixel8: null, build3d: null }],
  [/\bdetector de humo|\balarma\b/, 'alarma', { flat2d: null, pixel8: null, build3d: null }],
  [/\bpelota|\bf[uú]tbol/, 'pelota', { flat2d: null, pixel8: null, build3d: null }],
  [/\bguitarra/, 'guitarra', { flat2d: null, pixel8: null, build3d: null }],
  [/\bbicicleta|\bbici\b/, 'bicicleta', { flat2d: null, pixel8: null, build3d: null }],
  [/\bmoto\b/, 'moto', { flat2d: null, pixel8: null, build3d: null }],
  [/\bavi[oó]n/, 'avion', { flat2d: null, pixel8: null, build3d: null }],
  [/\btren\b|\bsubte\b/, 'tren', { flat2d: null, pixel8: null, build3d: null }] ];
// words that name a person of the ronda -> the roles that draw them
const ROLE_WORDS = [[/\bsuegra\b/, ['suegra']], [/\bsuegro\b/, ['suegro']], [/\bcuñad[oa]/, ['cunado']], [/\babuela\b/, ['grandma']], [/\babuelo\b/, ['grandpa']], [/\bjefe\b/, ['jefe']], [/\bnovi[oa]\b|\bpareja\b/, ['novia']], [/\bcebador/, ['cebador']], [/\bgaucho/, ['gaucho']], [/\bturista/, ['turista']], [/\btu viejo\b|\bpap[aá]\b/, ['papa']], [/\bingenier/, ['oficinista']], [/\bnene|\bnena|\bhij[oa]s?\b|\bchic[oa]s\b/, ['kid']]];
const low = s => String(s || '').toLowerCase();
// adds the props of each sentence to its scene (max 3 per scene, existing props first); returns the script copy and the missing things
function applyLexicon(script, style) { const j = JSON.parse(JSON.stringify(script)); const missing = new Set();
  (j.segments || []).forEach(sg => { const text = low(sg.text); const hits = LEX.filter(([re]) => re.test(text)); if (!hits.length) return;
    const scenes = (sg.visuals || [sg.visual]).filter(Boolean).map(v => v.type === 'mistake' ? v.over : v).filter(v => v && v.type === 'scene');
    hits.forEach(([, key, cols]) => { const name = cols[style]; if (name === undefined) return; if (name === null) { missing.add(key); return; }
      scenes.forEach(v => { const have = (v.props || []).map(p => low(typeof p === 'string' ? p : p.type)); if (have.includes(name) || have.length >= 3) return; v.props = [...(v.props || []), name]; }); }); });
  return { script: j, missing: [...missing] }; }
module.exports = { LEX, ROLE_WORDS, applyLexicon };
