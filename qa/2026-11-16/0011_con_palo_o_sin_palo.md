# Visual analysis: 0011_con_palo_o_sin_palo

style flat2d · duration 35.8s · loudness -12.7 LUFS, peak -0.8 dBFS · voice gemini · vision gemini-3.8-flash

The reel features clean typography and good visual clarity in the infographic and diagram shots (stem anatomy and board summaries). However, severe physical logic issues occur with character interactions, most notably a mate floating mid-air on a chest with no hands holding it, miniature character scaling in the quincho scene, and an unfinished shopping cart prop.

## Scores
visual_logic 4/10 · graphics 6/10 · overall 5/10

## Visual logic
**clean**
- Shot 2 leaf/stem diagram clearly shows the difference between leaf and stick with accurate pointers.
- Shot 3 and shot 11 boards are cleanly laid out and readable.
**unclean**
- Shot 4: Characters are scaled down to miniature proportions (occupying less than a quarter of the frame height) while the brick fireplace and quincho background are gigantic.
- Shot 6: The mate gourd and bombilla float completely unsupported in mid-air in front of the office worker's chest; both of her arms are hanging straight down at her sides.
- Shot 8: The shopping cart lacks a basket body, leaving the yerba packages floating in white space above wheels.

## Graphics
**clean**
- Clear color contrasts between yerba con palo and sin palo bowls.
- Text labels and captions stay well inside the safe margins.
**unclean**
- Shot 0: Four bowls are displayed in a row repeating 'con palo' and 'sin palo' twice instead of showing a clear 2-item comparison.
- Shot 1: The character's raised arm is an awkward straight diagonal polygon with no elbow bend.
- Shot 9: The orange '¡OFERTA!' badge from the previous scene persists above the captions, creating visual clutter over 'SON MUCHOS'.

## Issues
- [high] hands shot 6: Mate gourd floats on the character's chest with bombilla while both arms hang down at her sides. → Attach character holding hand to mate gourd using the f2grip pose, curling fingers around the side.
- [medium] scale shot 4: Characters are tiny relative to the massive background fireplace and room height. → Scale character figures up so hip height aligns with counter level and figures occupy 50-60% of frame height.
- [medium] objects shot 8: Shopping cart basket is missing or invisible, leaving yerba packages floating above wheels. → Ensure shopping cart SVG includes a visible wire basket mesh containing the items.
- [low] match shot 0: Four yerba bowls are drawn across the screen duplicating labels instead of a neat 2-bowl side-by-side comparison. → Limit compare view to 2 larger, detailed bowls (one con palo, one sin palo).
- [low] labels shot 9: Lingering '¡OFERTA!' sticker element crowds the top caption area over 'SON MUCHOS'. → Clear persistent sale badge overlays when transitioning into the crowd shot.

## Visual learnings for the next run
- AVOID (hands): Never render handheld props (mate, flasks, cups) without attaching an arm and curling hand explicitly grasping them.
- DO (scale): Keep human characters sized to roughly half the vertical 9:16 frame height in indoor/patio scenes rather than shrinking them to fit oversized background furniture.
