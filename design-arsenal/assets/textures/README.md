# Texture manifest

The reduced pack bundles only `overlays/vignette.png` (184 KB). Photo textures and heavy overlays are omitted; source them from CC0 providers:

- Poly Haven: https://polyhaven.com/textures
- ambientCG: https://ambientcg.com/
- Subtle Patterns: https://www.toptal.com/designers/subtlepatterns/
- Hero Patterns: https://heropatterns.com/

Procedural alternatives:

```bash
# fine grain tile
magick -size 1024x1024 xc:gray50 -attenuate 0.55 +noise Gaussian -colorspace Gray -auto-level grain.png

# vignette overlay
magick -size 3840x2160 radial-gradient:white-black -alpha off vignette-mask.png
```

The full local arsenal also includes 7 CC0 photo tiles, 7 procedural tiles and 10 alpha overlays.

