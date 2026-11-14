# Style: toy3d (sunny 3D meadow, toy figures)

Look settings: `toy3d.json` (clean karaoke captions at the top, headline cards under them, bloom + ambient occlusion + colour grade, Charon voice).
Translator: `toy3d.js` takes text, headlines, callouts, boards and the poll 1:1 from `flat2d` and only swaps the pictures, so a 2D/3D pair is a clean A/B test:
- scene / reaction / object / mistake → template `prado` (engine `T.prado`, figure `makeBall`): sunny meadow with flowers, trees, white fence, little house, clouds.
- title / number / list / checklist / dots / timeline / poll → the same navy infographic boards as flat2d.
Camera (chosen by the translator, never the same twice in a row, long sentences get a second angle; a script may force one with `camera`):
- set-ups: wide, far, widelow, close, face, sideL, sideR, low, high, top, hands, dutch, duo (two people facing each other), ots (over the shoulder)
- moves: flow, pushin, pullout, crash, dollyL, dollyR, craneUp, craneDown, tiltUp, tiltDown, pan, lowpush, orbitL, orbitR, arcTop
Characters: cebador, friend, stranger, you, grandma, grandpa, kid, worker, gaucho, oficinista, estudiante, turista and the nations with their flag on the shirt: argentino, uruguayo, paraguayo, brasileno, chileno, aleman. Unknown roles get a stable look of their own.
Faces: smile, happy, neutral, angry, outraged, bored, sad, surprised, proud, love, laugh; the sip mouth (small dot) comes by itself while drinking.
Actions: hold mate / termo / both / yerba pack / pava / bombilla / celular / facturas / azucarera / bizcochitos / matera / termometro, `drink`, `pour`, plus body actions (wave, cheer, no, nod, shock, laugh ...).
Objects (type object): shown big on a small table, turning slowly: mate kinds (with face when `mascot`), termo, yerba, pava, bombillas (all kinds in a rack) or one kind (recta, curva, pico_loro, resorte, paleta, cana, alpaca), the small things above, auto, camioneta, colectivo.
Props in a scene (`props` or from the place name): auto, camioneta, colectivo (can drive past), mesa, banco.
Still missing: more places than the meadow (kitchen, plaza, patio, beach, office).

Daily A/B: `scripts/daily.js` picks one of the day's scripts (rotates by day of year), `scripts/ab3d.js` builds it again in this style after the 2D release (same voice take). It is posted as the 4th reel of the day.

## QA checklist (check on every new reel)
Figures and props
- **Figure:** round head with face resting directly on a soft body that stands on the ground. No legs, no neck, no arms: the hands are floating balls next to the body.
- **Holding:** the ball hand grips the gourd / flask at its side; the prop moves with the hand and never floats away from it. The yerba pack is carried in front with both hands.
- **Drinking:** the bombilla mouthpiece sits exactly in the mouth, the mouth is a small round dot while sipping, the gourd tilts slightly towards the face.
- **Pouring:** the termo is held slanted (well past horizontal), its spout tip is right above the opening of the mate and the water falls into the gourd. Never a termo held upright next to the mate, never a spout pointing beside the gourd.
- **Figures:** light skin only, one hair colour (dark brown; grandma/grandpa grey).
Scene and light
- Sunny and bright: blue sky, soft shadows under the figures, no grey haze, no dark patches on the grass.
- Butterflies stay behind the figures, never across faces or hands.
Layout and text
- Captions at the top, headline cards under them; cards may touch the top of a head in close-ups but never cover eyes or mouth.
- Nothing important in the bottom 15 % (Instagram UI).
