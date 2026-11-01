# Safe-zone guides

Transparent PNG overlays for composition checks. Composite over a draft at 100%.

| File | Dimensions | Use |
|---|---|---|
| desktop-1440p-16-9.png | 2560x1440 | 1440p 16:9 |
| desktop-16-10.png | 2560x1600 | 16:10 laptop |
| desktop-4k-16-9.png | 3840x2160 | 4K 16:9 desktop |
| mobile-9-20.png | 1440x3200 | 9:20 phone |
| square-1-1.png | 2400x2400 | square |
| tablet-3-4.png | 2048x2732 | 3:4 tablet |
| ultrawide-32-9.png | 5120x1440 | 32:9 ultrawide |

```bash
magick draft.jpg assets/guides/desktop-4k-16-9.png -compose over -composite draft-guides.jpg
```
