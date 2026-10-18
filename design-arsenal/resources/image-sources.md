# Image sources, APIs and licensing

Rule of thumb: **an image without a clear license is a risk, not a resource.**
Always keep URL, author, license and download date. Use `exiftool` to embed
credit where appropriate.

## Free stock (check each site's license)

| Source | License model | API |
|---|---|---|
| [Unsplash](https://unsplash.com/) | Unsplash License (free, attribution appreciated) | [API](https://unsplash.com/developers) |
| [Pexels](https://www.pexels.com/) | Pexels License (free, attribution optional) | [API](https://www.pexels.com/api/documentation/) |
| [Pixabay](https://pixabay.com/) | Pixabay Content License | [API](https://pixabay.com/api/docs/) |
| [StockSnap](https://stocksnap.io/) | CC0 | — |
| [Burst](https://burst.shopify.com/) | Free for commercial use | — |
| [Kaboompics](https://kaboompics.com/) | Free, own license | — |
| [Picjumbo](https://picjumbo.com/) | Free/attribution | — |
| [Life of Pix](https://www.lifeofpix.com/) | Free | — |
| [Reshot](https://www.reshot.com/) | Free | — |
| [Rawpixel](https://www.rawpixel.com/) | Freemium, public domain + premium | — |
| [Public Domain Pictures](https://www.publicdomainpictures.net/) | Public domain | — |

## Archives, museums and science

| Source | What you get | License |
|---|---|---|
| [Wikimedia Commons](https://commons.wikimedia.org/) | Millions of images, per-file license | CC0/CC BY/CC BY-SA/PD |
| [Openverse](https://openverse.org/) | Open-content search | Per result |
| [Flickr Commons](https://www.flickr.com/commons) | Historical archives | Per result |
| [Smithsonian Open Access](https://www.si.edu/openaccess) | Art, science, 3D | CC0 |
| [The Met — Open Access](https://www.metmuseum.org/about-the-met/policies-and-documents/open-access) | Historical art | CC0 |
| [Art Institute of Chicago](https://www.artic.edu/open-access) | Art, high resolution | CC0 |
| [Rijksmuseum Data](https://www.rijksmuseum.nl/en/research/conduct-research/data) | Dutch art | PD/CC0 |
| [Europeana](https://www.europeana.eu/) | European heritage | Per result |
| [Digital Public Library of America](https://dp.la/) | US archives | Per result |
| [Library of Congress — Free to Use](https://www.loc.gov/free-to-use/) | Curated sets | PD/CC0 |
| [NYPL Digital Collections](https://digitalcollections.nypl.org/) | Maps, photos, ephemera | Per result |
| [NASA Images](https://images.nasa.gov/) | Space, Earth, missions | PD (most) |
| [APOD](https://apod.nasa.gov/apod/astropix.html) | Daily astronomy | Check credit |
| [ESA/Hubble](https://esahubble.org/images/) | Hubble high-resolution | CC BY 4.0 (most) |
| [Webb Telescope](https://webbtelescope.org/images) | JWST | CC BY 4.0 |
| [NASA Earth Observatory](https://earthobservatory.nasa.gov/) | Earth, climate | PD/CC BY |
| [Poly Haven](https://polyhaven.com/textures) | Textures, HDRIs, models | CC0 |
| [ambientCG](https://ambientcg.com/) | PBR textures | CC0 |

## Useful APIs

- Wikimedia Commons:
  `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=...&gsrnamespace=6&prop=imageinfo&iiprop=url|extmetadata&format=json`
- [Openverse API](https://docs.openverse.org/api/) — aggregated search with
  licenses.
- [NASA Images API](https://images-api.nasa.gov/) — `search?q=...`
- [NASA API](https://api.nasa.gov/) — APOD, Earth, Mars; free key.
- [Met Collection API](https://metmuseum.github.io/) — no key.
- [Art Institute of Chicago API](https://api.artic.edu/docs/) — no key.
- [Rijksmuseum API](https://data.rijksmuseum.nl/) — free key.
- [Smithsonian Open Access API](https://www.si.edu/openaccess) — free key.
- [Europeana APIs](https://apis.europeana.eu/) — free key.
- [DPLA API](https://dp.la/developers) — free key.
- [Library of Congress API](https://www.loc.gov/apis/) — JSON, no key.
- [NYPL API](https://api.repo.nypl.org/) — token.
- [Unsplash API](https://unsplash.com/documentation) — demo 50 req/h.
- [Pexels API](https://www.pexels.com/api/documentation/) — free key.
- [Pixabay API](https://pixabay.com/api/docs/) — free key.
- [Wallhaven API](https://wallhaven.cc/help/api) — SFW/NSFW filters, optional key.
- [Poly Haven API](https://api.polyhaven.com/) — assets and files JSON.

## Licenses explained

| License | You can | You must |
|---|---|---|
| **CC0 / Public Domain** | anything, no permission | nothing (attribution appreciated) |
| **CC BY** | use, modify, commercial | credit author + license + changes |
| **CC BY-SA** | use, modify, commercial | credit + share derivatives under the same license |
| **CC BY-ND** | use and commercial | credit; do not distribute modified versions |
| **CC BY-NC** | use and modify non-commercially | credit; no commercial use |
| **Unsplash License** | use, modify, commercial | do not sell unmodified copies; do not claim as your own |
| **Pexels License** | use, modify, commercial | do not sell unmodified copies; no endorsement |
| **Pixabay License** | use, modify, commercial | do not sell unmodified copies |
| **OFL 1.1** | fonts: use, modify, embed | keep the license; do not sell the font alone |
| **MIT / ISC / BSD** | code/icons, commercial | keep copyright and license |
| **GPL / AGPL** | use, modify, commercial | distribute derivatives under the same license |
| **Apache-2.0** | use, modify, commercial | keep notice, license, changes; patent grant |

## Attribution template

```text
"Title" by Author (Year).
Source: URL
License: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
Changes: cropped, color graded, extended canvas, grain added.
```

## Source hygiene

1. Download from the original site, not an aggregator.
2. Verify the license on the file page, not in the search result.
3. Record the date and exact URL.
4. If people are identifiable, consider model releases.
5. If there are brands, logos or protected art, avoid commercial use.
6. For AI: check the model license and training-data terms.
7. Save a copy of the license text next to the asset.
8. `exiftool -Artist=... -Copyright=... -License=... img.jpg`
