// 5-minute explainer "La historia del mate" in the pixel style, 16:9 landscape (YouTube), narrated by Charon (Gemini, one request per chapter).
// Built like the big YouTube explainers: cold open with a question, title card, one linear journey through time, one picture per idea,
// numbers and places shown (maps), few words on screen (chapter cards + subtitles), a closing thought that calls back the opening.
// usage: node samples/explainer_mate.js [--edge]  -> work/explainer_mate/spec.json ; node pipeline/build.js work/explainer_mate/spec.json
const fs = require('fs'), path = require('path');
const EDGE = process.argv.includes('--edge');
const Y = 738;
const P = (o, x, s = 120, extra = {}) => ({ kind: 'person', ...o, x, y: Y, s, ...extra });
const GUA = { shirt: '#b5713a', pants: '#8a5a36', hair: 'long', band: '#d43a3a', feather: '#2f9e6e', necklace: '#f2c230', face: 'happy' };
const VIEJO = { ...GUA, hair: 'short', hairColor: '#c9c2b8', face: 'smile' };
const JES = { shirt: '#5a3a24', robe: true, hair: 'short', hairColor: '#3a2416', face: 'smile' };
const GAU = { shirt: '#e9dfc8', pants: '#5a4636', hat: 'boina', hatColor: '#2b2b2b', scarf: '#d43a3a', mustache: true, face: 'happy' };
const CEB = { shirt: '#e5483a', hair: 'short', face: 'happy' }, AMI = { shirt: '#2f6fd0', hair: 'side', face: 'happy' }, DES = { shirt: '#f2a922', hair: 'bob', face: 'happy' };
const ABU = { shirt: '#8a4fd0', hair: 'bun', hairColor: '#c9c2b8', glasses: true, face: 'smile' }, TRA = { shirt: '#f08a24', hair: 'short', hat: 'hardhat', face: 'happy' };
// camera moves (world 540x960, the 16:9 view is 480x270 at zoom 1, people stand at y 738)
const M = [270, 640];
const cam = {
  pullback: (c = [270, 620], m = M) => ({ z0: 2.0, z1: 0.95, c0: c, c1: m, sp: 0.6 }),
  push: (c = [270, 640], m = M) => ({ z0: 1.0, z1: 1.45, c0: m, c1: c, sp: 0.7 }),
  panR: (y = 640, z = 1.15) => ({ z0: z, z1: z, c0: [170, y], c1: [370, y], sp: 0.9 }),
  panL: (y = 640, z = 1.15) => ({ z0: z, z1: z, c0: [370, y], c1: [170, y], sp: 0.9 }),
  craneUp: (x = 270) => ({ z0: 1.1, z1: 1.15, c0: [x, 660], c1: [x, 330], sp: 0.75 }),
  craneDown: (x = 270) => ({ z0: 1.05, z1: 1.15, c0: [x, 300], c1: [x, 650], sp: 0.7 }),
  vertigo: (c = [270, 630]) => ({ z0: 1.35, z1: 1.4, c0: c, c1: c, dz: 0.8, sp: 0.8 }),
  hold: (c = M, z = 1.1) => ({ z0: z, z1: z * 1.06, c0: c, c1: c, sp: 1 }),
  map: (from, z1 = 0.62) => ({ z0: 2.2, z1, from, c1: [270, 470], sp: 0.6 }) };
const sh = (place, p) => ({ tpl: 'pix', p: { place, ...p } });
const title = (text, sub) => sh('titulo', { big: { text, sub }, cam: { z0: 1, z1: 1.08, c0: [270, 480], c1: [270, 470] } });
const S = []; let CH = 0; const say = (text, ...shots) => S.push({ text, chapter: CH, emo: 'neutral', shots, callouts: [] });

// 0 — cold open
CH = 0;
say('Todos los días, en este mismo momento, millones de personas se están pasando lo mismo de mano en mano.', sh('plaza', { cast: [P(CEB, 150, 115, { hold: 'mate' }), P(AMI, 270, 115), P(DES, 390, 115)], pass: [0, 1], cam: cam.pullback([210, 610]), fx: { rays: 'sun' } }));
say('No es plata. Tampoco es un celular.', sh('plaza', { cast: [P(AMI, 270, 150, { hold: 'mate', face: 'smile' })], cam: cam.push([270, 600]) }));
say('Es una calabaza con hojas secas y agua caliente.', sh('macro', { cam: cam.hold([270, 480], 1.0) }));
say('¿Por qué una simple infusión es capaz de juntar a perfectos desconocidos?', sh('plaza', { cast: [P(DES, 170, 125, { face: 'surprised' }), P(CEB, 330, 125, { hold: 'mate' })], pass: [1, 0], cam: cam.vertigo([250, 620]) }));
say('Parece algo simple. Pero detrás de este gesto hay casi quinientos años de historia.', sh('plaza', { cast: [P(CEB, 150, 115, { hold: 'mate' }), P(AMI, 270, 115), P(DES, 390, 115)], cam: cam.craneUp(270), fx: { rays: 'sun' } }));
say('Esta es la historia del mate.', title('MATE', 'LA HISTORIA DE UNA PLANTA QUE UNE'));

// 1 — the plant and the Guaraní
CH = 1;
say('Todo empieza en la selva paranaense, entre lo que hoy es Paraguay, Brasil y el noreste argentino.', sh('mapa', { lit: [{ c: 'py', u: 0.55 }, { c: 'br', u: 0.65 }, { c: 'ar', u: 0.75 }], cam: cam.map('py', 0.75) }));
say('Ahí crece un árbol de hojas duras y brillantes: la ilex paraguariensis.', sh('yerbal', { cam: cam.panR(600, 1.2), fx: { rays: 'sun' } }));
say('Los guaraníes la llamaban caá, que significa, simplemente, hierba.', sh('selva', { cast: [P(GUA, 220, 125, { hold: 'mate' })], cam: cam.push([220, 610]) }));
say('La masticaban, la tomaban en infusión y la llevaban en sus viajes.', sh('selva', { cast: [P(GUA, 200, 120, { hold: 'mate', act: 'drink' }), P(VIEJO, 330, 120)], cam: cam.panL(640, 1.2) }));
say('Para ellos no era solo una bebida. Era un regalo.', sh('selva', { cast: [P(VIEJO, 270, 140, { face: 'love' })], cam: cam.vertigo([270, 610]) }));
say('Cuenta una leyenda que una noche la luna bajó a caminar por la selva, y que un viejo guaraní la salvó de un yaguareté.', sh('selva', { night: true, cast: [P(VIEJO, 230, 120, { face: 'surprised' })], cam: cam.craneDown(240), fx: { glow: [{ f: 0.45, x: 380, y: 220, r: 40, rgb: '220,230,255' }] } }));
say('En agradecimiento, la luna le dejó una planta nueva, para que nunca más estuviera solo.', sh('selva', { night: true, cast: [P(VIEJO, 230, 120, { face: 'love' }), { kind: 'mate', x: 330, y: Y, s: 90, glow: true, face: 'smile' }], cam: cam.push([290, 640]) }));

// 2 — the Jesuits
CH = 2;
say('En el siglo diecisiete llegaron los jesuitas.', sh('mision', { cast: [P(JES, 230, 125)], cam: cam.pullback([230, 600]), fx: { rays: 'sun' } }));
say('Al principio quisieron prohibirla. Decían que era un vicio.', sh('mision', { cast: [P(JES, 270, 145, { face: 'angry', gest: 'no' })], cam: cam.vertigo([270, 600]) }));
say('Pero terminaron haciendo exactamente lo contrario.', sh('mision', { cast: [P(JES, 200, 125, { hold: 'mate', face: 'sly' }), P(GUA, 330, 125)], cam: cam.push([260, 620]) }));
say('En sus misiones aprendieron a cultivarla, y la convirtieron en el oro verde de la región.', sh('yerbal', { cast: [P(JES, 180, 115), P(GUA, 320, 115)], cam: cam.panR(640, 1.1), fx: { rays: 'sun' } }));
say('Hasta que en mil setecientos sesenta y siete fueron expulsados.', sh('mision', { night: true, cast: [P(JES, 270, 125, { face: 'sad' })], cam: cam.craneUp(270) }));
say('Y el secreto para hacer germinar la semilla se perdió por más de cien años.', sh('yerbal', { night: true, cam: cam.hold([270, 620], 1.15) }));

// 3 — gauchos and cities
CH = 3;
say('Mientras tanto, el mate se volvió costumbre en todas partes.', sh('campo', { cast: [P(GAU, 220, 120, { hold: 'mate' })], cam: cam.pullback([220, 610]), fx: { rays: 'sun' } }));
say('En el campo, el gaucho lo tomaba al amanecer, antes de salir a trabajar.', sh('campo', { cast: [P(GAU, 260, 135, { hold: 'mate', act: 'drink' })], cam: cam.push([260, 600]), fx: { rays: 'sun' } }));
say('En las casas de familia, en los mercados, en las calles de la ciudad.', sh('cocina', { cast: [P(ABU, 220, 120, { hold: 'termo' }), P(CEB, 330, 120)], cam: cam.hold(M, 1.15) }), sh('mercado', { cast: [P(DES, 270, 120, { hold: 'mate' })], cam: cam.panR(640, 1.2) }), sh('plaza', { cast: [P(AMI, 200, 115, { hold: 'mate' }), P(CEB, 330, 115)], cam: cam.panL(640, 1.15) }));
say('Con los inmigrantes que llegaron de Europa, el mate se mezcló con nuevas costumbres: unos le pusieron azúcar, otros cáscara de naranja.', sh('cocina', { cast: [P(ABU, 200, 120, { hold: 'mate' }), P(GAU, 330, 120, { face: 'surprised' })], cam: cam.panR(640, 1.15) }));
say('Ricos y pobres, criollos e inmigrantes: todos compartían la misma bombilla.', sh('plaza', { cast: [P(GAU, 110, 105), P(ABU, 210, 105), P(CEB, 310, 105, { hold: 'mate' }), P(DES, 420, 105)], pass: [2, 1], cam: cam.pullback([260, 620]) }));

// 4 — from the tree to your mate
CH = 4;
say('Recién a principios del siglo veinte se volvió a cultivar a gran escala, sobre todo en Misiones.', sh('mapa', { lit: [{ c: 'ar', u: 0.6 }], cam: cam.map('ar', 0.7) }));
say('Y el camino desde el árbol hasta tu mate tiene cinco paradas.', sh('yerbal', { cam: cam.craneDown(270), fx: { rays: 'sun' } }));
say('Primero, la cosecha. Las ramas se cortan a mano.', sh('yerbal', { cast: [P(TRA, 240, 125)], cam: cam.push([240, 620]), fx: { rays: 'sun' } }));
say('Después, el zapecado. Las hojas pasan unos segundos por el fuego, para que no se pongan negras.', sh('galpon', { cast: [P(TRA, 200, 120)], cam: cam.panR(640, 1.2), fx: { glow: [{ x: 350, y: 690, r: 46, rgb: '255,150,60', flick: true }] } }));
say('Luego se secan despacio, con calor y con humo.', sh('galpon', { cam: cam.craneUp(270), fx: { glow: [{ x: 270, y: 700, r: 40, rgb: '255,170,90', flick: true }] } }));
say('Se estacionan durante meses, a veces más de un año, para que el sabor se suavice.', sh('galpon', { cast: [{ kind: 'yerba', x: 200, y: Y, s: 90 }, { kind: 'yerba', x: 270, y: Y, s: 90 }, { kind: 'yerba', x: 340, y: Y, s: 90 }], cam: cam.vertigo([270, 640]) }));
say('Y por último se muelen, se mezclan y se envasan.', sh('super', { cast: [P(DES, 200, 120), { kind: 'yerba', x: 330, y: Y, s: 110, glow: true }], cam: cam.push([310, 640]) }));

// 5 — what is inside
CH = 5;
say('¿Y por qué da tanta energía?', sh('cocina', { cast: [P(AMI, 270, 160, { face: 'surprised', emote: '?' })], cam: cam.vertigo([270, 600]) }));
say('La famosa mateína es, en realidad, cafeína. La misma molécula que tiene el café.', sh('macro', { cam: cam.push([270, 470], [270, 480]) }));
say('Pero viene acompañada de otras sustancias que hacen que el efecto sea más suave y dure más.', sh('poros', { cam: cam.panR(480, 1.1) }));
say('Además tiene antioxidantes, y por eso muchos lo eligen en lugar del café.', sh('macro', { cam: cam.vertigo([270, 480]) }));
say('Por eso el agua nunca debe hervir. Entre setenta y ochenta grados, la yerba no se quema.', sh('cocina', { cast: [P(ABU, 220, 125, { hold: 'termo' }), { kind: 'pava', x: 340, y: Y, s: 100 }], cam: cam.push([300, 640]), fx: { glow: [{ x: 340, y: 670, r: 30, rgb: '255,200,140' }] } }));

// 6 — the ritual
CH = 6;
say('Pero lo más interesante del mate no es lo que tiene adentro.', sh('patio', { cast: [P(CEB, 160, 115, { hold: 'mate' }), P(AMI, 270, 115), P(DES, 380, 115)], cam: cam.craneDown(270), fx: { rays: 'sun' } }));
say('Es la forma en que se toma.', sh('patio', { cast: [P(CEB, 160, 115, { hold: 'mate' }), P(AMI, 270, 115), P(DES, 380, 115)], cam: cam.push([270, 620]), fx: { rays: 'sun' } }));
say('Hay uno que ceba. Prepara cada mate y lo pasa, siempre en el mismo orden.', sh('patio', { cast: [P(CEB, 160, 120, { hold: 'termo' }), P(AMI, 300, 120)], pass: [0, 1], cam: cam.panR(640, 1.2), fx: { rays: 'sun' } }));
say('El primero se lo toma él, porque es el más amargo.', sh('patio', { cast: [P(CEB, 270, 150, { hold: 'mate', act: 'drink', face: 'disgusted' })], cam: cam.vertigo([270, 600]) }));
say('Y nadie dice gracias hasta que no quiere más. Decir gracias es salir de la ronda.', sh('patio', { cast: [P(AMI, 220, 130, { gest: 'no', face: 'smile' }), P(CEB, 340, 130, { face: 'surprised' })], cam: cam.push([280, 620]) }));
say('Y si alguien mueve la bombilla, la ronda entera lo mira mal.', sh('patio', { cast: [P(DES, 200, 125, { hold: 'mate', face: 'worried' }), P(CEB, 330, 125, { face: 'angry', emote: 'anger' })], cam: cam.push([270, 620]) }));
say('No importa si conocés a la otra persona. Si estás en la ronda, el mate te llega.', sh('plaza', { cast: [P(CEB, 170, 120, { hold: 'mate' }), P(DES, 330, 120, { face: 'love' })], pass: [0, 1], cam: cam.pullback([260, 620]), fx: { rays: 'sun' } }));

// 7 — today
CH = 7;
say('Hoy el mate se toma en Argentina, Uruguay, Paraguay y el sur de Brasil.', sh('mapa', { lit: [{ c: 'ar', u: 0.5 }, { c: 'uy', u: 0.6 }, { c: 'py', u: 0.7 }, { c: 'br', u: 0.8 }], cam: cam.map('uy', 0.62) }));
say('Uruguay es el país que más toma por persona: casi diez kilos de yerba por año.', sh('mapa', { lit: [{ c: 'uy', u: 0.05 }], cam: { z0: 0.75, z1: 2.4, from: null, c0: [270, 470], c1: [330, 620], sp: 0.7 } }));
say('En Paraguay se toma frío, con hielo y yuyos, y se llama tereré.', sh('selva', { cast: [P(DES, 230, 125, { hold: 'termo' }), P(GUA, 340, 125, { hold: 'mate' })], cam: cam.panR(640, 1.2), fx: { rays: 'sun' } }));
say('En el sur de Brasil lo llaman chimarrão, y se toma en una calabaza enorme.', sh('playa', { cast: [P(AMI, 260, 135, { hold: 'mate', act: 'drink' })], cam: cam.push([260, 620]), fx: { rays: 'sun' } }));
say('Y la costumbre viajó todavía más lejos, con los inmigrantes que volvieron al Líbano y a Siria.', sh('costa', { night: true, faro: false, cast: [P(AMI, 220, 120, { hold: 'mate' })], cam: cam.panR(640, 1.15), fx: { glow: [{ f: 0.45, x: 380, y: 200, r: 36, rgb: '220,230,255' }] } }));
say('Y uno de los mayores compradores de yerba argentina está a doce mil kilómetros: Siria.', title('SIRIA', 'A 12.000 KILÓMETROS'));

// 8 — closing
CH = 8;
say('Quinientos años después, el gesto sigue siendo el mismo.', sh('costa', { cast: [P(CEB, 120, 110, { hold: 'mate' }), P(ABU, 200, 110)], pass: [0, 1], cam: cam.pullback([310, 520], [270, 640]), fx: { rays: [310, 526] } }));
say('Lo hicieron los guaraníes, los jesuitas, los gauchos… y también tu abuela.', sh('costa', { cast: [P(GUA, 110, 105), P(JES, 200, 105), P(GAU, 290, 105), P(ABU, 380, 105, { hold: 'mate' })], cam: cam.panR(640, 1.05), fx: { rays: [310, 526] } }));
say('Alguien calienta el agua, alguien ceba, y el mate da la vuelta.', sh('costa', { cast: [P(CEB, 120, 120, { hold: 'termo' }), P(ABU, 210, 120)], pass: [0, 1], cam: cam.vertigo([200, 640]), fx: { rays: [310, 526] } }));
say('Porque el mate, en el fondo, no se toma.', sh('costa', { cam: { z0: 1.6, z1: 1.9, c0: [430, 660], c1: [430, 300], sp: 0.8 }, fx: { lamp: { x: 430, y: 273, on: 0.55, a0: Math.PI * 1.05 }, rays: [310, 526] } }));
say('Se comparte.', title('SE COMPARTE', ''));

const spec = { id: 'explainer_mate', title: 'La historia del mate', wide: true, preset: 'pixel8', tts: EDGE ? 'edge' : undefined,
  geminiStyle: 'Leé este guion como el narrador de un documental de divulgación en YouTube: un argentino de Buenos Aires de unos 35 años, voz cálida y tranquila, con acento rioplatense y sheísmo ("yerba" suena "sherba"). Ritmo pausado y claro, con pequeñas pausas entre frases, sin exagerar, como alguien que cuenta una historia fascinante. No leas títulos ni números de capítulo.',
  style: { light: 'golden', captionY: 965, captionSize: 46, wordsPerCaption: 7, capCase: 'as is', calloutY: 560, musicVol: 0.1, sfxVol: 0.12, cut: 'hard' },
  thumb: { lines: ['LA HISTORIA', 'DEL MATE'] }, follow: false, segments: S };
const dir = path.join(__dirname, '..', 'work', 'explainer_mate'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(spec, null, 1));
const words = S.reduce((a, s) => a + s.text.split(/\s+/).length, 0); console.log('segments', S.length, 'words', words, '≈', Math.round(words / 2.3), 's');
