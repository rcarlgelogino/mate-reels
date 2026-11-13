# Style: toy3d (sunny 3D meadow, toy figures)

Look settings: `toy3d.json` (clean karaoke captions at the top, headline cards under them, bloom + ambient occlusion + colour grade, Charon voice).
Translator: `toy3d.js` takes text, headlines, callouts, boards and the poll 1:1 from `flat2d` and only swaps the pictures, so a 2D/3D pair is a clean A/B test:
- scene / reaction / object / mistake → template `prado` (engine `T.prado`, figure `makeBall`): sunny meadow with flowers, trees, white fence, little house, clouds.
- title / number / list / checklist / dots / timeline / poll → the same navy infographic boards as flat2d.
Camera: `flow` (wide, then push in on the focus person), `wide`, `close`. One person or someone doing something → close.
Actions: hold mate / termo / both / yerba pack, `drink`, `pour`, plus body actions (wave, cheer, no, nod, shock, laugh ...).

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
