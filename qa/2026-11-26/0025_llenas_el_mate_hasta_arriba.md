# Visual analysis: 0025_llenas_el_mate_hasta_arriba

style pixel8 · duration 37.234s · loudness -12.2 LUFS, peak -0.8 dBFS · voice gemini · vision gemini-3.6-flash

The pixel-art visual reel executes the 'pixel8' aesthetic well, featuring charming hero mate characters and legible retro typography. However, critical instructional steps such as covering, turning upside down, and shaking the mate (shots 9-10) are depicted with static holding poses instead of showing the described action.

## Scores
visual_logic 6/10 · graphics 8/10 · overall 7/10

## Visual logic
**clean**
- Shot 6 clearly illustrates water overflowing from an overfilled mate cup as described in the text.
- Shot 12 nicely depicts the 'montañita' (slope of yerba) with a tilted mate character.
**unclean**
- shot 9: The spoken voice describes covering, flipping upside down, and shaking the mate, but the visual shows the character holding the mate upright static.
- shot 10: Continues describing flipping and shaking, but visual remains a static upright pose.
- shot 3: Characters in cell 12 sit too low and clip awkwardly against the bottom screen boundary.

## Graphics
**clean**
- Consistent retro pixel rendering and font usage throughout the reel.
- Warm glow halos and hero character faces on the mate objects fit the pixel8 QA spec.
**unclean**
- shot 2: Visual scene is almost identical to shot 1 without layout or posture progression.

## Issues
- [high] match shot 9: The text describes covering, turning upside down, and shaking the mate, but the character holds it upright motionless. → Animate the mate turned upside down with a palm sprite over the opening and add shake offset keyframes.
- [high] match shot 10: Narrative continues describing the shaking technique while the image remains static upright. → Include motion lines/pixel dust particles showing the shaking action in progress.
- [medium] people shot 3: Characters in cell 12 are cut off at the bottom frame boundary. → Raise character Y position so figures sit cleanly behind the counter surface.

## Visual learnings for the next run
- DO (match): Match physical instructional verbs (flipping, shaking, pouring) with dedicated object rotation and motion animations.
- AVOID (people): Avoid placing small background characters so low that their lower halves get clipped by the canvas frame.
