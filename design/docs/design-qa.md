# Design QA

Use this as a gate before shipping a wallpaper, poster, design system or series.

## Composition

- [ ] One primary focal point; secondary supports, does not compete.
- [ ] Subject sharp at 100%; no halos or AI artifacts.
- [ ] No visible seam between subject and field.
- [ ] Field temperature matches source; light direction is consistent.
- [ ] Negative space is intentional, not accidental emptiness.
- [ ] Squint test preserves hierarchy.
- [ ] Grayscale test preserves structure.
- [ ] Thumbnail at 300 px reads clearly.

## Safe zones

- [ ] Left icon column clear (desktop).
- [ ] Top panel/menu bar clear.
- [ ] Bottom dock/taskbar clear.
- [ ] Mobile status/notch and gesture areas clear.
- [ ] Tested with the matching `assets/guides/` overlay.
- [ ] Tested with real windows/icons open.

## Color and type

- [ ] Text contrast measured on the composited background.
- [ ] Accent used sparingly; no more than two accents.
- [ ] Dark mode recalibrated, not inverted.
- [ ] Type scale has clear steps; no near-duplicate sizes.
- [ ] Tracking/leading appropriate for size.
- [ ] Glyph coverage for accents, quotes, dashes, currency.
- [ ] Text out of busy areas or protected by a scrim.

## Texture and artifacts

- [ ] Grain consistent, not patchy.
- [ ] No banding in gradients (noise/dither applied).
- [ ] Vignette subtle and intentional.
- [ ] No compositing halo/edge fringe.
- [ ] No accidental transparency flattening.

## Files

- [ ] Correct dimensions/ratio for each target.
- [ ] Correct color profile (sRGB for screens).
- [ ] Sensible format and file size.
- [ ] EXIF orientation correct.
- [ ] Metadata stripped or preserved intentionally.
- [ ] Mobile/ultrawide variants checked.

## Provenance

- [ ] Source, author, license URL recorded.
- [ ] Changes documented.
- [ ] Attribution included where required.
- [ ] AI model/checkpoint/seed recorded if used.
- [ ] Original and recipe archived.
- [ ] Manifest updated.

## Series

- [ ] Shared palette/type/grain.
- [ ] Composition logic consistent but not repetitive.
- [ ] Naming convention followed.
- [ ] No orphan variants.
