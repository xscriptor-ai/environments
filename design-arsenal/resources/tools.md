# Open-source image and design tools

Curated and verified in October 2026. **Pack** shows what the reduced
repository edition supports out of the box; the full local arsenal also bundles
user-level binaries under `tools/`.

## Raster / photo

| Tool | What it is | License | Pack |
|---|---|---|---|
| [GIMP](https://www.gimp.org/) | Full raster editor, plug-ins, GEGL | GPL-3.0 | system install |
| [Krita](https://krita.org/) | Digital painting, illustration, 2D animation | GPL-3.0 | system install |
| [MyPaint](https://mypaint.app/) | Fast painting, infinite brushes | GPL-2.0 | optional |
| [Pinta](https://www.pinta-project.com/) | Simple Paint.NET-like editor | MIT | optional |
| [LazPaint](https://lazpaint.github.io/) | Lightweight layered editor | GPL-3.0 | optional |
| [Photopea](https://www.photopea.com/) | Web editor with PSD support (not open source) | web | web |
| [Glimpse](https://glimpse-editor.org/) | GIMP fork (status uncertain) | GPL-3.0 | optional |

## Vector / UI / layout

| Tool | What it is | License | Pack |
|---|---|---|---|
| [Inkscape](https://inkscape.org/) | SVG vector editing, tracing, typography | GPL-2.0+ | system install |
| [Penpot](https://penpot.app/) | Product design and prototypes, Figma alternative | MPL-2.0 | web/self-host |
| [Graphite](https://graphite.rs/) | Vector/procedural editor in Rust | Apache-2.0 | web/app |
| [Scribus](https://www.scribus.net/) | Editorial layout and PDF | GPL-2.0 | system install |
| [SVG-Edit](https://github.com/SVG-Edit/svgedit) | Browser SVG editor | MIT | web |
| [Karbon](https://calligra.org/karbon/) | Calligra vector editor | GPL-2.0 | optional |

## RAW / photography

| Tool | What it is | License | Pack |
|---|---|---|---|
| [darktable](https://www.darktable.org/) | Non-destructive RAW workflow | GPL-3.0 | system install |
| [RawTherapee](https://www.rawtherapee.com/) | High-quality RAW processing | GPL-3.0 | system install |
| [digiKam](https://www.digikam.org/) | Photo library management | GPL-2.0 | optional |

## CLI processing (the core of this pack)

| Tool | What it is | License | Pack |
|---|---|---|---|
| [ImageMagick](https://imagemagick.org/) | Raster Swiss army knife: compose, text, filters, batch | ImageMagick License (Apache-like) | required |
| [ImageMagick Usage](https://usage.imagemagick.org/) | The real recipe reference | docs | reference |
| [FFmpeg](https://ffmpeg.org/) | Image, sequences, video, filters, loops | LGPL/GPL | required |
| [libvips](https://www.libvips.org/) | Streaming processing for huge images | LGPL-2.1 | optional |
| [GraphicsMagick](http://www.graphicsmagick.org/) | Stable ImageMagick fork | MIT-style | optional |
| [ExifTool](https://exiftool.org/) | EXIF/IPTC/XMP, copyright, GPS | Perl Artistic/GPL | optional |
| [Exiv2](https://exiv2.org/) | Metadata reading/editing | GPL-2.0 | optional |
| [LittleCMS](https://www.littlecms.com/) | ICC color management | MIT | via IM |
| [ArgyllCMS](https://www.argyllcms.com/) | Display/printer calibration | GPL-3.0 | optional |
| [DisplayCAL](https://displaycal.net/) | Calibration UI for Argyll | GPL-3.0 | optional |

## Upscaling / restoration / local AI

| Tool | What it is | License | Pack |
|---|---|---|---|
| [Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN) | 4x super-resolution, general/anime models | BSD-3-Clause | optional |
| [Upscayl](https://upscayl.org/) | Real-ESRGAN GUI | AGPL-3.0 | optional |
| [chaiNNer](https://github.com/chaiNNer-org/chaiNNer) | Node editor for restoration models | GPL-3.0 | optional |
| [waifu2x-ncnn-vulkan](https://github.com/nihui/waifu2x-ncnn-vulkan) | Upscale/denoise for anime/illustration | MIT | optional |
| [IOPaint](https://github.com/Sanster/IOPaint) | Inpainting/outpainting with LaMa/SD | Apache-2.0 | optional |
| [LaMa](https://github.com/advimman/lama) | High-resolution inpainting | Apache-2.0 | optional |
| [rembg](https://github.com/danielgatis/rembg) | Background removal | MIT | optional |
| [ComfyUI](https://github.com/comfyanonymous/ComfyUI) | Diffusion graph, inpaint/outpaint | GPL-3.0 | optional |
| [InvokeAI](https://github.com/invoke-ai/InvokeAI) | Generation suite with canvas | Apache-2.0 | optional |
| [AUTOMATIC1111](https://github.com/AUTOMATIC1111/stable-diffusion-webui) | Classic Stable Diffusion WebUI | AGPL-3.0 | optional |

## Optimization / formats

| Tool | What it does | License | Pack |
|---|---|---|---|
| [oxipng](https://github.com/shssoichiro/oxipng) | Lossless PNG, multithreaded | MIT | optional |
| [pngquant](https://pngquant.org/) | Lossy PNG with palette | GPL-3.0 | optional |
| [mozjpeg](https://github.com/mozilla/mozjpeg) | Better JPEG compression | BSD-3-Clause | optional |
| [jpegoptim](https://github.com/tjko/jpegoptim) | JPEG optimization/quantization | GPL-3.0 | optional |
| [libwebp](https://developers.google.com/speed/webp) | WebP (`cwebp`, `gif2webp`) | BSD-3-Clause | via IM |
| [libavif](https://github.com/AOMediaCodec/libavif) | AVIF (`avifenc`) | BSD-2-Clause | via IM |
| [libjxl](https://github.com/libjxl/libjxl) | JPEG XL (`cjxl`) | BSD-3-Clause | via IM |
| [SVGO](https://github.com/svg/svgo) | SVG optimization | MIT | optional (Node) |
| [Squoosh](https://squoosh.app/) | Web codec comparison | Apache-2.0 | web |
| [ImageOptim](https://imageoptim.com/) | GUI optimizer (macOS) | GPL-2.0 | macOS |
| [Trimage](https://trimage.org/) | GUI optimizer (Linux) | MIT | optional |

## Motion / 3D / typesetting

| Tool | What it is | License | Pack |
|---|---|---|---|
| [Blender](https://www.blender.org/) | 3D, compositing, motion graphics | GPL-3.0 | system install |
| [Kdenlive](https://kdenlive.org/) | Video editing | GPL-2.0 | optional |
| [Natron](https://natrongithub.github.io/) | Node compositing | GPL-2.0 | optional |
| [Synfig](https://www.synfig.org/) | 2D vector animation | GPL-3.0 | optional |
| [OpenToonz](https://opentoonz.github.io/) | Production 2D animation | BSD-3-Clause | optional |
| [FontForge](https://fontforge.org/) | Font creation/editing | GPL-3.0 | system install |
| [Typst](https://typst.app/) | Programmable typesetting | Apache-2.0 | optional |

## Source and discovery

- [Awesome Creative Coding](https://github.com/terkelg/awesome-creative-coding)
- [AlternativeTo — Image Editing](https://alternativeto.net/category/graphics/image-editing/)
