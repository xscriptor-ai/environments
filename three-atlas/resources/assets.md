# Assets and Licenses

Always verify the license before shipping. This file is a starting point, not legal advice.

## Models

| Source | License notes |
|---|---|
| Poly Haven | CC0 for most assets; check each item |
| ambientCG | CC0 for materials/textures |
| Kenney | CC0 for game assets |
| Quaternius | CC0 for many packs; check each |
| Sketchfab | Varies by model: CC BY, CC BY-SA, CC BY-NC, etc. |
| Khronos glTF Sample Assets | Varies; for testing |
| poly.pizza | Aggregator; check original license |

## HDRIs and textures

- Poly Haven HDRIs (CC0).
- ambientCG materials (CC0).
- Use 1K-2K HDRIs for runtime; 4K+ for offline renders.
- Compress textures to KTX2 for runtime.
- Pack ORM (AO/Roughness/Metalness) when possible.

## Fonts

| Source | Notes |
|---|---|
| Google Fonts | Open licenses (OFL, Apache); check per family |
| Fontshare | Free for personal/commercial with terms |
| System font stack | No download, best for DOM UI |
| OFL fonts | Safe to embed if license included |

For 3D text (troika/TextGeometry), include the license file and verify embedding rights.

## Icons and UI

- Use your own icon set or an open set (Lucide, Feather, Tabler) under its license.
- Avoid mixing icon styles.
- Provide alt text or `aria-label` for icon-only buttons.

## People, brands, and logos

- Do not use celebrity likenesses or brand logos without permission.
- Scanned people/places may have personality/property rights beyond the model license.
- AI-generated assets: check the model provider's terms and your local law.

## Attribution

- CC BY / CC BY-SA require attribution; include author, source, license, and changes.
- CC0 requires no attribution but is appreciated.
- Keep an `ASSETS.md` or credits page with all sources and licenses.
- Include license text where required.

## Pipeline

1. Source asset with license.
2. Record source and license in `credits`.
3. Optimize for runtime (meters, applied transforms, PBR).
4. Compress (Draco/meshopt/KTX2).
5. Validate color spaces.
6. Test in the final scene.
7. Update the credits page.

## Red flags

- "Free" assets with unclear terms.
- No author or source.
- Scanned brands/logos.
- Fonts labeled "for personal use only".
- AI assets with restrictions on commercial use.
- Assets that require attribution you cannot display.

## Credits template

```
Asset: <name>
Author: <author>
Source: <url>
License: <CC0 / CC BY 4.0 / ...>
Changes: <scaled, retopologized, retextured, ...>
```
