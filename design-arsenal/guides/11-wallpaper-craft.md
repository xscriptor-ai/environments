# 11 — Wallpaper craft

## 1. What makes a good wallpaper

It works at three distances:

- **Thumbnail** (300 px): a clear shape, color and mood.
- **Desktop** (100%): detail, texture, type legibility.
- **Occupied** (with windows/icons): calm zones, no fighting with UI.

It is not a poster. It does not need to say everything. It needs to create a
place.

## 2. Genres

### Ambient / atmospheric

- Gradients, blur, fog, light, grain.
- No clear subject or a distant silhouette.
- Best for focus, coding, long sessions.
- Risk: generic. Differentiate with color, texture and a subtle focal point.

### Architectural

- Facade, interior, stair, ceiling, detail.
- Strong geometry, material, light.
- Best for structured, design-forward setups.
- Risk: busy; crop and simplify.

### Landscape / nature

- Horizon, sky, water, forest, desert.
- Best for calm, wide canvases.
- Risk: postcard. Use negative space, weather, unusual light.

### Abstract / generative

- Mesh gradients, noise fields, waves, particles, shaders.
- Best for brand systems, tech, series.
- Risk: banding, sameness. Use grain, asymmetry, a focal event.

### Typographic

- A word, a phrase, a number, coordinates.
- Best for editorial, personal, brand pieces.
- Risk: illegibility at distance. Use scale and contrast.

### Cutout / collage

- Subject isolated on a designed field.
- Best for objects, products, portraits.
- Risk: fake edges. Use clean masks, shadows, grain.

### Dark / OLED

- Near-black fields, small bright accents.
- Best for OLED, night use.
- Risk: banding, crushed shadows, smearing. Use subtle gradients and off-black.

## 3. Light

- **Direction**: side light reveals texture; backlight creates silhouette; top
  light is dramatic; flat light is graphic.
- **Quality**: hard = graphic/contrast; soft = calm/editorial.
- **Temperature**: warm = intimate; cool = distance/tech; mixed = tension.
- **Time**: blue hour, golden hour, overcast, night. Each is a palette.
- **Glow**: a soft radial highlight draws the eye; use one, not five.

## 4. Texture and grain

- Grain unifies layers and hides banding.
- Fine grain (ISO-like) for photography; coarse grain for analog/film.
- Apply globally, not per layer.
- Paper/concrete textures add tactility; keep opacity low over faces.
- Halftone/pattern can be a graphic layer; scale it to the canvas.
- Avoid noise on text edges; apply grain before type or mask it.

## 5. Color temperature continuity

- Sample the source; do not invent a field color from a different world.
- If the source is warm, the field can be a darker warm neutral, not blue-gray.
- If the source is cool, a warm accent creates tension but needs a reason.
- Dim the field 5-15% to push the subject forward.
- Use a gradient to avoid flatness and to simulate light falloff.

## 6. Multi-monitor

- Design per output; do not assume the same crop works everywhere.
- For a span, create one wide canvas and place subjects at the seams intentionally.
- For independent outputs, share palette/type/grain but vary composition.
- Keep icon zones clear on the primary monitor.
- Test with actual window placement; a centered subject may sit behind a window.

## 7. Desktop environments

- **Hyprland**: hyprpaper, swww, mpvpaper; see `../resources/wallpaper-tools.md`.
- **GNOME/KDE**: native wallpaper settings; use 16:9/ultrawide presets.
- **Windows**: left icon column; bottom taskbar; test with "span" mode.
- **macOS**: menu bar top, dock bottom; right side often free.
- **Lockscreen**: different crop; keep the clock area clear.

## 8. Format and performance

- Photos: WebP/JPEG/AVIF; graphics: PNG/WebP; avoid 30 MB BMP/PNG.
- 4K JPEG/WebP at q85-92 is usually under 3 MB.
- Gradients: add dither/noise to prevent banding.
- Animated: 8-15 s loop, 24-30 fps, no audio.
- Test decode time on the target machine; 8K is rarely worth it.

## 9. Series design

A series is coherent when it shares:

- Palette (or a constrained family).
- Type pairing and scale.
- Grain/vignette treatment.
- Composition logic (for example, subject always on the right third).
- Naming and metadata.

It is varied when it changes:

- Subject and scale.
- Method (blur, panel, gradient, cutout).
- Canvas ratio.
- Light/time of day.
- Density (minimal vs detailed).

## 10. QA (the final pass)

- [ ] Read at 300 px.
- [ ] Read at 100% on the target display.
- [ ] Read with icons/windows.
- [ ] Grayscale check.
- [ ] Squint check.
- [ ] Seam/edge check at 200%.
- [ ] Text contrast check.
- [ ] Banding check in gradients.
- [ ] File size/format check.
- [ ] License/attribution check.
- [ ] Naming/manifest check.
- [ ] Mobile/ultrawide variants check.
- [ ] Original + recipe archived.

## 11. What not to do

- Stretch a phone image.
- Put the subject behind the icon column.
- Use 100% white text on a busy photo.
- Add five gradients and three typefaces.
- Use pure black + pure white + saturated accent everywhere.
- Ignore the seams.
- Ship without testing in the actual environment.
