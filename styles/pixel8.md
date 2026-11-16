# pixel8: pixel-art style

Reference: the reels of science_in_8bit (user, 2026-11-16). Own figures and places only, nothing copied.

- Everything is drawn into a 540x960 world canvas with whole pixels (`T.pix` in `engine/engine.js`); the camera crops it and scales it up without smoothing, so zooming makes the pixels bigger.
- People: round head with face, flag on the shirt for nations, floating ball hands, no arms, no legs (same rule as toy3d). Light skin only, one hair colour (grandparents grey).
- Objects (mate, termo, yerba pack, pava, bombillas, things) are big heroes with a face and a warm glow behind.
- Pour rule: the termo is held slanted and its spout tip sits over the opening of the mate (`pTermoPour`). Drinking: the bombilla tip on the mouth, mouth a small dot.
- Text: Pixelify Sans everywhere (style `font`), captions at the top with the spoken word in yellow, titles and numbers as big pixel letters over the dimmed scene.
- Music: chiptune lead (`chip: true`).
- Daily: `scripts/daily.js` builds one reel per day in this style (file name ends in `_px`), a different script than the 3D A/B one. `PIXEL_DAILY=0` switches it off.
- `scripts/oldpx.js <name>` rebuilds a posted reel in this style with the sound of the posted reel (voice Charon), no new Gemini call.

Ideas from the second batch of examples (not built yet): warm light halos around windows and lamps, fireflies, depth layers that move at different speeds when the camera moves.
