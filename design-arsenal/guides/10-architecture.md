# 10 — Architecture as design material

## 1. Three architectures

1. **Built** — buildings, interiors, facades, infrastructure.
2. **Information** — navigation, hierarchy, naming, findability.
3. **Visual** — grid, layers, structure, rhythm.

A wallpaper can borrow from all three: the image is built space, the layout is
visual architecture, and the set organization is information architecture.

## 2. Reading a building for composition

- **Symmetry** -> monumentality, calm. Center the subject; use a strong axis.
- **Repetition** -> pattern, rhythm. Crop tight to make it abstract.
- **Convergence** -> depth. Place the vanishing point at a third or center.
- **Frame within frame** -> doors, windows, arches. Use them to isolate a subject.
- **Scale** -> a tiny human or object makes the building monumental.
- **Material** -> concrete is heavy/calm; glass is cold/reflective; wood is warm;
  brick is rhythmic; metal is industrial.
- **Light** -> direction, hardness, time of day. Blue hour is cinematic; hard noon
  is graphic; overcast is soft and minimal.

## 3. Architectural photography checklist

- Verticals straight? Use lens correction or accept the tilt intentionally.
- Horizon level? A 1 degree tilt is noticeable on a facade.
- Perspective: shoot from a corner for two-point, from the center for one-point.
- Include foreground/midground/background for depth.
- Expose for highlights; recover shadows later.
- Avoid converging verticals unless they are the point.
- Look for a human element for scale and story.
- Shoot a detail, a mid-shot and a wide; the wallpaper may come from any.

## 4. Abstraction

The best architectural wallpapers often abstract:

- Crop out the ground and sky; leave only geometry.
- Rotate 90/180 degrees to disorient and create pattern.
- Increase contrast; reduce color to 2-3 tones.
- Blur the background, keep one detail sharp.
- Mirror a facade to create a symmetrical pattern.
- Repeat a window/stair module into a grid.
- Use a detail as a texture field.

## 5. Information architecture for a visual set

Organize source images and outputs:

```text
project/
  00-source/
    raw/
    licensed/
    ATTRIBUTION.md
  10-palette/
    palette.json
    palette.png
  20-work/
    mobile/
    desktop/
    ultrawide/
  30-final/
    4k/
    mobile/
    variants/
  series.md
```

Naming:

```text
{series}-{subject}-{orientation}-{method}-{variant}-{size}.{ext}
north-facade-desktop-blur-01-3840x2160.webp
```

Rules:

- Lowercase, hyphens, no spaces.
- No "final-final-v3".
- Dates in ISO 8601 when relevant.
- One folder per deliverable type.
- A manifest (JSON/CSV) with source, license, recipe, dimensions, checksum.

## 6. From building to wallpaper

1. Choose the **mechanism**: symmetry, rhythm, convergence, frame, material, light.
2. Choose the **subject**: a whole building or a detail.
3. Choose the **canvas**: desktop, ultrawide, mobile.
4. Recompose for the canvas; do not just stretch.
5. Build the field: blur/gradient/solid/texture.
6. Add type only if it serves the idea.
7. Unify with grain/light/color.
8. QA in the real environment.

## 7. References

- `../resources/architecture.md` — magazines, archives, photography, IA.
- *Thinking Architecture* — Peter Zumthor.
- *Experiencing Architecture* — Steen Eiler Rasmussen.
- *The Architecture of Happiness* — Alain de Botton.
- *Grid Systems* — Josef Muller-Brockmann.
- *How Buildings Learn* — Stewart Brand (layers, adaptation, change).
- *How to Make Sense of Any Mess* — Abby Covert (information architecture).
