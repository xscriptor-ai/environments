# Gradient sources

32 editable SVG gradients. Rasterize to 4K (3840x2160), mobile (1440x3200) or ultrawide (5120x1440).

```bash
for f in assets/gradients/svg/*.svg; do
  name=$(basename "$f" .svg)
  rsvg-convert -w 3840 -h 2160 "$f" -o "/tmp/${name}-4k.png"
  magick "/tmp/${name}-4k.png" -quality 90 "/tmp/${name}-4k.webp"
done
```

| Name | Source |
|---|---|
| aurora | [svg/aurora.svg](svg/aurora.svg) |
| candy | [svg/candy.svg](svg/candy.svg) |
| citrus | [svg/citrus.svg](svg/citrus.svg) |
| copper | [svg/copper.svg](svg/copper.svg) |
| cream | [svg/cream.svg](svg/cream.svg) |
| dusk | [svg/dusk.svg](svg/dusk.svg) |
| ember | [svg/ember.svg](svg/ember.svg) |
| forest | [svg/forest.svg](svg/forest.svg) |
| ice | [svg/ice.svg](svg/ice.svg) |
| ink | [svg/ink.svg](svg/ink.svg) |
| lagoon | [svg/lagoon.svg](svg/lagoon.svg) |
| lilac | [svg/lilac.svg](svg/lilac.svg) |
| mesh-aurora | [svg/mesh-aurora.svg](svg/mesh-aurora.svg) |
| mesh-candy | [svg/mesh-candy.svg](svg/mesh-candy.svg) |
| mesh-desert | [svg/mesh-desert.svg](svg/mesh-desert.svg) |
| mesh-forest | [svg/mesh-forest.svg](svg/mesh-forest.svg) |
| mesh-mono | [svg/mesh-mono.svg](svg/mesh-mono.svg) |
| mesh-ocean | [svg/mesh-ocean.svg](svg/mesh-ocean.svg) |
| mesh-orchid | [svg/mesh-orchid.svg](svg/mesh-orchid.svg) |
| mesh-sunset | [svg/mesh-sunset.svg](svg/mesh-sunset.svg) |
| midnight | [svg/midnight.svg](svg/midnight.svg) |
| mint | [svg/mint.svg](svg/mint.svg) |
| mono | [svg/mono.svg](svg/mono.svg) |
| nebula | [svg/nebula.svg](svg/nebula.svg) |
| noir | [svg/noir.svg](svg/noir.svg) |
| ocean | [svg/ocean.svg](svg/ocean.svg) |
| rose | [svg/rose.svg](svg/rose.svg) |
| sage | [svg/sage.svg](svg/sage.svg) |
| sand | [svg/sand.svg](svg/sand.svg) |
| sky | [svg/sky.svg](svg/sky.svg) |
| sunset | [svg/sunset.svg](svg/sunset.svg) |
| volcanic | [svg/volcanic.svg](svg/volcanic.svg) |
