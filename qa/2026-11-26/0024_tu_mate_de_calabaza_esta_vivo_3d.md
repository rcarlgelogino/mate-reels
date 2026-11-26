# Visual analysis: 0024_tu_mate_de_calabaza_esta_vivo

style build3d · duration 36.867s · loudness -12.0 LUFS, peak -0.9 dBFS · voice gemini · vision gemini-3.1-flash-lite

The reel captures the requested 3D style well, but suffers from inconsistent character proportions and some awkward object interactions. While the visual storytelling is clear, the lack of physical weight and occasional clipping issues detract from the overall polish.

## Scores
visual_logic 6/10 · graphics 7/10 · overall 6/10

## Visual logic
**clean**
- The transition from plant to gourd is visually clear.
- The kitchen environment is consistent throughout the reel.
- The sequence of curing the mate is easy to follow.
**unclean**
- shot 1: The grandmother's glasses clip through her face.
- shot 13: The spoon appears to float or clip into the mate rather than being held naturally.
- shot 16: The character's hand placement on the mate is inconsistent.

## Graphics
**clean**
- The text overlay is legible and follows the requested style.
- The color palette is consistent with the build3d aesthetic.
**unclean**
- shot 1: Text occasionally overlaps with the character's face.
- shot 5: Labels are slightly cluttered.

## Issues
- [medium] people shot 1: Grandmother's glasses clip through her face. → Adjust the glasses model to sit on the surface of the face mesh.
- [medium] hands shot 13: Spoon is not properly grasped by the hand. → Ensure the hand mesh wraps around the spoon handle.
- [low] objects shot 16: The mate size fluctuates slightly between shots. → Maintain a fixed scale reference for the mate object.
- [low] guard shot 4: camera too close (backed off by the guard) in 1 shot(s) → fix it at the source in the style (layout, camera plan, visual choice)

## Visual learnings for the next run
- DO (hands): Ensure hands are physically interacting with objects by wrapping fingers around them rather than just placing them nearby.
- AVOID (layering): Avoid placing text or labels directly over character faces to maintain clear expressions.
