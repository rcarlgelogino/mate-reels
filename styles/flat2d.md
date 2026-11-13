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
