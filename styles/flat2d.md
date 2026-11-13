# Style: flat2d (2D vector explainer)

Look settings: `flat2d.json` (captions in a dark box at the top, headlines under them, parallax drift, big infographic boards, Charon voice).
Translator: `flat2d.js` maps the script's neutral visuals to shots:
- scene → template `flat` (kitchen with foreground counter, park, plaza at sunset, patio, beach). Roles get fixed looks (cebador = red shirt, grandma = grey bun + glasses, grandpa = beard + glasses, ...). 1–5 people are laid out automatically; `pass` animates hand to hand (receiver reaches out).
- reaction → solid colour close-up of one person (red, purple, blue, green, orange).
- object → hero object on a navy grid (mate mascot face, steam, labels).
- title / number / list / checklist / dots / timeline → board infographics on navy.
- mistake → big red X over a scene.
Figures: IK arms (hands reach targets, props sit in the hand with the fingers in front), sip cycle when drinking, soft pose transitions.

Fast to render in the cloud (no 3D pipeline for 2D shots).
To switch styles: change `styles/active.json`. A new style needs `<name>.json` + `<name>.js` (`toSpec(script)`).

## QA checklist (check on every new reel; found in real test reels)
Figures and props
- **Grip:** a held object sits *in* the hand: palm behind the object, fingers in front over its edge. Never a hand disc pasted on the middle of the mate (fixed 2026-11-13).
- **Drinking:** the bombilla tip touches the lips, the gourd covers the chin, the hand stays visible on the side of the gourd.
- **Pass:** giver stretches the arm, receiver reaches out before the mate arrives, the mate ends in the receiver's hand – never floating in front of a chest.
- **Arms** always ease into a pose (no popping); raised arms are drawn in front of the head; "no" = head shake with relaxed arms.
- **Entrance:** figures fade in with a slight grow; no tiny figure that "pops" out of nothing.
- **Mate seams/grain** stay inside the gourd outline.
Proportions (1.75 m figure)
- mate ~10 cm (76 px on a 520 px figure), termo ~32 cm (128 px), kettle/yerba pack ~25 cm.
- Kitchen counter at the figures' hip (≈ 1/3 of their height: short cartoon legs); people stand behind it.
- Background objects (windows, parrilla, benches, lamps) sized to the people standing next to them; far objects (buildings, trees on the horizon) smaller.
Layout and text
- Captions in the dark box at the top, headline under it, nothing important in the bottom 15 % (Instagram UI).
- Headlines never cover faces or hands.
- One idea per shot; same scene may not repeat twice in a row without a change (new people, zoom, action).
