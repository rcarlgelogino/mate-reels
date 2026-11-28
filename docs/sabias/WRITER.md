# Daily "¿Sabías que…?" writer (Claude routine)

You write the two daily "¿Sabías que…?" mate reels for @todo.de.mate as full shooting scripts, the same way the hand-made hits were written
(docs/examples/0042s_cisterna.js 74k views, 0043s_lava.js 21k, 0044s_tio_ramon.js, 0045s_mati_tucuman.js). GitHub renders them later with the Charon voice.
Read those four generators first: they are the quality bar. The Gemini template (scripts/sabias.js) is only the fallback and is NOT the bar.

## What to make every day
1. **"recomendable"**: "¿Sabías que para <mate action> lo recomendable es <normal thing> y no <absurd, very specific real thing>?"
2. **"si"**: "¿Sabías que si <very specific absurd situation while drinking mate>, <obvious exaggerated consequence>?"
   It may be a chain reaction (tío Ramón: move the bombilla → uncle drops dead → he had the dam key → flood → no yerba) or an over-specific
   list of conditions with ticks (Tucumán ✔ + mate radiactivo ✔ + jueves de sol ✔ → te morís).
- Mate topics only, rioplatense voseo, extremely exaggerated but **very specific** (real names, places, models, dates). No generic jets or army hardware.
- Numbers must be real and well known (USGS, NASA, NOAA, encyclopedias); round them; if unsure, use another fact. Numbers are written in words in `text` (a voice reads it).
- Every sentence is something you can see, and **the absurd thing must touch the mate world**: lava is poured from the termo into the gourd, the hose of the tanker goes into the mate, the bombilla melts, the tongue smokes. Never just a label over a generic face.
- Logic: whatever is said is shown where it happens (a termo capacity is never written over a volcano crater).
- End: "Seguime para más datos de mate." 15–30 s. A new picture every 1–2 s. At least one laugh.
- Do not repeat topics or agents from the last 10 days: read rotation/sabias.json and docs/sabias/*/ before choosing.

## What you can use (engine/engine.js, template stage3d; look at the four examples for exact syntax)
Worlds: `casita` (dollhouse kitchen; options `noTruck`, `volcano`, `sunDisc`, `agentKind: bomba|meteorito|tsunami|tornado` with `agent:[{u,ak,ab}]` keys, `pile:{n,u0,u1}` field of gourds, `breakAt` walls break, `truck:[{u,tz}]`),
`patio` (family patio, round table, chairs from `seats`, dog `dogUp`), `represa` (Yacyretá dam, `agent` ak 0..1: gate bursts, pouring water, breaking wave),
`yerbal` (Misiones yerba fields swept by a wave, ak 0..1), `mapa` (Argentina map with gourds that vanish, ak 0..1), `cancha` (stadium of fans).
People: `{id, look:{skin,hair,hairStyle:short|curly|bun|ponytail,hat:boina|sombrero|cap|hardhat,hatColor,mustache,scarf,glasses,shirt,pants}, keys:[{u,px,pz,faceTo,sit,s,hold:'mate'|'termo'|'both',L,R (arm targets [x,y] or an anchor like 'vos.mate'),face,look,act:'drink',suck,lean (1.5 = fallen),bow,jump,hshake,nod,pour,termoColor,mateEmpty,mateNoBomb,mateGlow,wiggleL}]}`.
Faces: neutral smile happy laugh proud sly surprised shock scream angry rage sad worried scared confused disgusted derp dizzy starstruck sip suck determined cry.
Anchors: `<id>.head .mouth .mate .spout .L .R`, `valve`, `crater`, `agent`, `agent.label`, `sun`.
Effects (`fx`): stream (glow for lava), bubbles, stars, sweat, drops (color, size), burst (colors, dir), debris, flood (moving water), rocket (bombilla shoots up), sparkle, notes.
On screen: `labels:[{u0,u1,text,at|xy,dy,big}]` (black pills), `counter:{u0,u1,from,to,unit,prefix,label,lin}`, `gauge:{u0,to,max,unit}`, `rewind:{u0,u1}`, `flash`, `freeze`, `vote`, `shake`.
Camera: `cam3:[{u,a,r,h,ax,ay,az,on:'<anchor>'}]` (with `on`, h is relative to the anchor).
Sounds: `sounds:[{u,type:'lib:<name>',gain}]` with the files in assets/sfx (ls it), plus built-ins pour, pop, tick, ding, whoosh, swish.
If the idea needs something the engine cannot show, change the idea; do not edit the engine in this routine.

## Output (exactly this)
- `docs/sabias/<DAY>/a_<slug>.js` and `b_<slug>.js`: generators like the examples, each writing `docs/sabias/<DAY>/<id>.json` (id = `<DAY>_<slug>`, ascii).
- Run `node docs/sabias/<DAY>/a_<slug>.js` and `b_…`, then `node scripts/check_script.js docs/sabias/<DAY>/<id>.json` for both; fix every error it prints.
- Commit only `docs/sabias/<DAY>/` with the message "¿Sabías que? scripts <DAY>" and push to main. Do not touch any other file, trigger or workflow.
