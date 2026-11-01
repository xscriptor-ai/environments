# Build and install notes

October 2026.

## What worked

- The reduced pack uses system ImageMagick, FFmpeg, librsvg and jq, plus a local
  Python environment created by `scripts/setup.sh`.
- The full local design-arsenal also builds and installs user-level tools under
  `tools/`: libvips 8.18.7, Real-ESRGAN ncnn Vulkan, ExifTool 13.59, oxipng
  10.2.1 and a Python venv.
- Real-ESRGAN ncnn Vulkan runs on an NVIDIA RTX 4060 Max-Q (Vulkan ICD present).
- libvips was built from source with JPEG/PNG/WebP/TIFF/SVG support.
- 118 palettes were generated from upstream sources plus manual collections.
- 32 gradient families were generated as SVG sources (the full edition also
  rasterizes 4K/mobile/ultrawide clean+grain WebP).
- 21,691 icons were collected from 5 upstream sets (not bundled here).
- 12 OFL fonts were downloaded and registered with fontconfig (not bundled here).

## Gotchas

- **Pacman keyring**: the X Linux `x` repo may fail with
  `key ... is unknown` and `keyring is not writable`. Repair with:
  `sudo pacman-key --init && sudo pacman-key --populate archlinux x`,
  then add and locally sign the repository key if needed.
- **glib-mkenums / glib-genmarshal**: missing from the runtime glib2 package on
  this host. They were taken from the matching `glib2-devel` package and exposed
  through a custom pkg-config path for the libvips build.
- **ExifTool download**: use the SourceForge download URL; the direct
  exiftool.org tarball URL returned 404 at the time of writing.
- **ImageMagick `-extent`** flattens alpha unless `-background none`; this affects
  vignette/grain overlays. The CLI handles it.
- **Grayscale overlays** can turn a composite grayscale if their alpha is
  flattened; verify with `magick identify -format '%[colorspace] %[type]'`.
- **Fontconfig**: variable fonts may report odd default styles; use family names
  (`Inter`, `Fraunces`, etc.) or render text via SVG.
- **Smartcrop API**: the installed package exposes `SmartCrop().crop(image, w, h)`,
  not a top-level `crop()` function.
- **Stock-site licenses** change; verify on the file page before shipping.

## Reduced edition

The repository edition omits binaries, the venv, font/icon binaries, photo
textures and raster gradients. `docs/asset-manifest.md` lists exactly what is
included and where to fetch the rest.
