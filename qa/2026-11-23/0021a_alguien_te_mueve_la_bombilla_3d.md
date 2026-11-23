# Visual analysis: 0021a_alguien_te_mueve_la_bombilla

style build3d · duration 41.034s · loudness -12.0 LUFS, peak -0.9 dBFS · voice gemini · vision gemini-3.5-flash

The 3D environment and character models fit the build3d aesthetic well with clean textures and consistent lighting. However, several shots suffer from static object setups, awkward hand-gourd clipping, and repetitive camera angles.

## Scores
visual_logic 6/10 · graphics 7/10 · overall 6/10

## Visual logic
**clean**
- Consistent character styling and environment setup across the entire sequence.
- Clear character facial expressions during the cebador reaction shot.
**unclean**
- shot 6: The mate gourd clips into the character's torso and floats near the hand rather than being firmly gripped.
- shot 8: The mate gourd on the wooden table floats slightly above the surface with unnatural shadow contact.
- shot 9: Identical framing of the mate on the table repeated without camera movement or character interaction.
- shot 15: Character on the right edge is partially cut off by the frame border.

## Graphics
**clean**
- Clean 3D render quality with well-defined textures and vibrant outdoor lighting.
- Subtitle text styling is bold and legible throughout.
**unclean**
- shot 8: Static framing of table visual lacks dynamic 3D camera movement.

## Issues
- [medium] hands shot 6: Mate gourd floats and clips into character chest while stirring bombilla → Rig character hand to wrap around the gourd body correctly with collision bounds
- [medium] objects shot 8: Mate gourd floats slightly above the wooden table surface → Snap mate model base flush to the table mesh surface
- [medium] scene shot 9: Shot 9 reuses the exact same static shot of the mate on the table as shot 8 → Change camera angle to a tight close-up or add character interaction
- [low] people shot 15: Character entering frame is cut off at the right frame boundary → Adjust framing or character transform to keep character fully inside 9:16 safe area
- [low] guard shot 3: camera too close (backed off by the guard) in 3 shot(s) → fix it at the source in the style (layout, camera plan, visual choice)

## Visual learnings for the next run
- AVOID (objects): Do not repeat identical static object shots across consecutive dialogue lines without changing camera perspective or character action.
- DO (hands): Ensure hand models realistically wrap around the mate gourd without body clipping.
