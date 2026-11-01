# Mobile to desktop

A phone image is a portrait window; a desktop is a wide stage. Recompose; never
stretch.

## Aspect math

```text
9:16      1080x1920   1440x2560
9:20      1080x2400   1440x3200
16:9      1920x1080   2560x1440   3840x2160
16:10     2560x1600   3840x2400
21:9      3440x1440   5120x2160
32:9      5120x1440   7680x2160
3:4       1536x2048   2048x2732
1:1       2400x2400   3000x3000
```

At full desktop height H, a 9:16 source is 0.5625H wide. On a 16:9 canvas,
68% of the width is empty field. For 4K: source about 1215 px, field about
2625 px. The field is the design.

## Methods

1. **Ambient blur** — blurred cover field + sharp subject. Add grain,
   vignette, scrim. Safe but generic if composition/color are not intentional.
2. **Sampled solid/editorial panel** — solid or textured field + sharp panel.
   Add type, rules, coordinates, caption. Good for architecture/minimal.
3. **Gradient** — sample edge colors; continue the light; add shadow and noise.
   Good for skies/sunsets; watch banding.
4. **Mirror/triptych** — mirrored/edge-filled sides + sharp center. Hide seams
   with blur, scrim or a deliberate gutter.
5. **Edge stretch** — stretch 1 px columns into the field; blur. Only for clean
   vertical edges.
6. **Recomposition** — re-crop the original scene for landscape, move the
   subject to a third, design the empty space. Best result; slowest.

## Subject scale and upscale

Keep the sharp subject at 70-92% of canvas height. If the source cannot reach
that without upscaling, use Real-ESRGAN first. Inspect faces, hands, edges and
text at 100%. Do not AI-upscale flat vector art; rasterize SVG at target size.

## Safe zones

Desktop: left icon column about 8%; top panel about 4%; bottom dock 6-8%.
Ultrawide: icon column still left; subject around 60-70% width.
Mobile: top 7-8%, bottom 5-6%, sides about 4%.
Lockscreen: keep the clock area clear.

Check with the transparent guides:

```bash
magick draft.jpg assets/guides/desktop-4k-16-9.png -compose over -composite draft-guides.jpg
```

## Color and texture

Match temperature and light direction. Darken the field 5-15%. Add a subtle
gradient for falloff. Grain 2-6% at 4K; vignette subtle; scrim only where text
needs contrast. One global grain layer unifies the composite.

## Variants

Desktop 16:9 primary; ultrawide reframed; mobile 9:20; light/dark; editorial
panel; ambient. Share palette/type/grain; vary composition.

## QA

Thumbnail, 100%, grayscale, occupied desktop, seam at 200%, text contrast,
banding, file size, license, original + recipe archived.
