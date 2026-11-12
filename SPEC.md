# Reel spec reference (pipeline/build.js)

Working example: `runs/test/t01_A/spec.json`. All templates in action: `runs/test/templates/spec.json`.

```json
{
  "id": "2026-11-12_t01_A", "topic": "t01", "variant": "A", "ab": "statement hook vs question hook",
  "voice": "en-US-AndrewNeural", "rate": "+14%",
  "style": { "accent": "#ffd84a", "mood": "minor|major|latin", "bpm": 112 },
  "segments": [
    { "text": "Sentence shown in captions.", "say": "optional spoken form with the same word count",
      "shots": [ { "tpl": "gourd", "p": { }, "f": 1, "zoom": 1.0, "c": [0.5, 0.5] } ],
      "callouts": [ { "type": "big", "text": "500 YEARS", "sub": "OLD SECRET", "at": "five", "impact": true } ],
      "cues": [ { "type": "ding", "at": "record" } ] }
  ],
  "follow": true, "followSub": "STORIES ABOUT MATE",
  "caption": "...", "hashtags": ["#mate"]
}
```
- `f` = share of the segment time for that shot (jump cuts). `zoom` > 1 punches in toward `c` (x, y as 0..1 of the frame).
- `at` / `until` / `countTo` / `atB` = case-insensitive regex for a spoken word of that segment ("^six", "record"). Numbers are spoken as written by TTS: write "900" not "nine hundred".

## Callouts
| type | fields |
|---|---|
| big | text, sub, rot, color, impact |
| counter | from, to, prefix, suffix, decimals, sub, at, countTo |
| ratio | a, b, at, atB, sub |
| check / cross | text, sub, at (green ✓ / red ✗ badge) |
| pill | added automatically at "Follow ..." |

## Emotion
- Segment `emo`: excited, surprised, warm, nostalgic, proud, tense, funny, sad, angry, love, neutral. Changes TTS rate + pitch for that sentence (override with `"voice": {"rate": "+10%", "pitch": "+8Hz"}`) and sets the default face of all figures in its shots.
- Shot `emo`: `{ "face": "laugh", "act": "cheer", "who": [1, 3], "mateFace": "happy" }` (who = person index, list or "all"; default all).
- Faces: neutral, smile, happy, laugh, surprised, sad, angry, proud, love. Acts: jump, cheer, no, nod, shock, laugh, sigh, wave, hug.
- `style.look`: "clean" (default: white callout cards, accent pill on the active word), "outline" (old thick-outline style) or "explainer" (reference-reel style: small sentence-case karaoke captions at the top, outline callouts in the lower third, almost no vignette; pair with navy `board` shots and 3D shots on navy `color`/`floor`/`bg`).
- Callout `y` and spec `followY` move a callout or the follow pill (use when a board fills the middle).

## Templates (`tpl` + `p`)
| tpl | params | good for |
|---|---|---|
| board | kind: dots {total, on, cols, label, sub} · cards {items:[{n, title, sub, ok}]} · checklist {rows:[{text, ok}]} · poll {question, options[], cta:false} · timeline {items:[{label, text}]} · title {text, sub}; bg (default navy #16233a), color (accent), top | flat 2D infographics (explainer look), numbered tips, do/don't, comment polls |
| flat | scene: kitchen (tableY, foreground counter), park, plaza (evening city), patio, beach (time: evening), solid (bg), navygrid (bg); people:[{who 0-5, x, y (feet, 0-1), s (height px, 1500 = half-body close-up with y 1.34), hold: mate|termo|both, act: wave|cheer|jump|nod|no|shock|laugh|sigh|hug|pass|drink|point, face, flip, back, hairStyle, shirt, stripe+stripes (sash|v|h), shorts, glasses, beard, steam}]; objs:[{type: calabaza|madera|acero|imperial|termo|yerba|bombilla|heart, x, y, s, face, steam, bob, delay}]; labels:[{text, x, y, tx, ty}]; pass:{from,to} | true 2D vector look of the reference reels (flat characters + layered scenes); test 2026-11-12 runs/styletest/flat2d_* |
| react | who 0-5 (person) or mascot: true (+ mate); face; act; bg; ring; hold (false = no mate in hand); mateFace | emotional beats, hooks, re-hooks (clean close-up) |
| gourd | mate: calabaza, imperial, madera, acero, cuia, guampa; face (mascot face on the gourd); rec; termo; pack; bg: kitchen, studio, outdoor; move: pushin, orbit, pullout; spin | hooks, gourd types |
| prep | step: yerba, shake, tilt, water, cold, bombilla, stir, sugar; mate | how-to |
| ronda | people 2-6; time: evening, day; setting: table, park; stop (index of the person shaking the head); close; mate | sharing rules |
| places | place: plaza, beach, office, kitchen; people 1-2; gesture: sip, pass, carry; mate | where people drink |
| object | obj: bombilla (type paleta, resorte, chata), termo, yerba (palo), mate (type); explode; labels[] | equipment |
| compare | items[{band: AR, UY, BR, PY, SY, CL, US, ES, X; mate; bar; label; value}], mode: bars | countries, numbers |
| plantation | mode: aerial, harvest, piles (leaves to bag), trucks (multiplying ghost trucks) | production, volume |
| factory | stage: line, sapecado, secado, estacionamiento, molienda, envasado | processing |
| jungle | cam: wide, fire | history, Guarani |

## Sound cues (`cues[].type`)
whoosh, hit, boomSoft, snap, pop, popBig, beep, shutter, tick, ding, buzz, sparkle, blip, rise, suck, bag, swish, rustle, pour, hiss, shake, clink, clank, birds, crackle, rumble, hum, clock, waves, keys. Templates add their own ambience automatically.
