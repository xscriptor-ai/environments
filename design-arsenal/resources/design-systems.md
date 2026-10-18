# Design systems, UI architecture and tokens

A design system is not a component library: it is a shared contract between
design and code. For wallpapers and visual pieces, the important part is the
**architecture**: tokens, scales, hierarchy and documentation.

## Reference systems

| System | Why study it |
|---|---|
| [Material 3 / Material You](https://m3.material.io/) | Dynamic color from an image, tonal roles, motion, adaptive layouts |
| [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) | Hierarchy, typography, materials, gestures, accessibility |
| [IBM Carbon](https://carbondesignsystem.com/) | Tokens, grid, accessibility and enterprise governance |
| [Adobe Spectrum](https://spectrum.adobe.com/) | Scales, color, iconography and component documentation |
| [Shopify Polaris](https://polaris.shopify.com/) | Product language, content and commerce patterns |
| [Atlassian Design System](https://atlassian.design/) | Scales, tokens and patterns for complex products |
| [GitHub Primer](https://primer.style/) | Foundations, components and open-source accessibility |
| [Microsoft Fluent 2](https://fluent2.microsoft.design/) | Materials, elevation, motion and cross-platform design |
| [GOV.UK Design System](https://design-system.service.gov.uk/) | Clarity, content and accessibility as requirements |
| [U.S. Web Design System](https://designsystem.digital.gov/) | Tokens, utilities and government-grade components |
| [Ant Design](https://ant.design/) | Dense product patterns and color scales |
| [Salesforce Lightning](https://www.lightningdesignsystem.com/) | Tokens, theming and accessibility |
| [BBC GEL](https://www.bbc.co.uk/gel) | Multi-platform editorial language |
| [Vanilla Framework](https://vanillaframework.io/) | Canonical's lightweight system |
| [Clarity](https://clarity.design/) | VMware system, density and data |
| [PatternFly](https://www.patternfly.org/) | Application and dashboard patterns |
| [Braid](https://seek-oss.github.io/braid-design-system/) | SEEK system, tokens and themes |
| [Wise Design](https://wise.design/) | Identity, content and fintech components |
| [Radix](https://www.radix-ui.com/) | Accessible primitives and perceptual color scales |
| [shadcn/ui](https://ui.shadcn.com/) | Copy-paste components with CSS tokens |
| [Base UI](https://base-ui.com/) | Headless primitives |
| [Park UI](https://park-ui.com/) | Components with tokens and themes |
| [Chakra UI](https://chakra-ui.com/) | Tokens, semantics and composition |

## System architecture

### 1. Layers

1. **Primitives / reference tokens** — raw material: `blue-500`, `space-4`,
   `radius-md`, `font-size-3`.
2. **Semantic tokens** — intent: `color-bg`, `color-text`, `color-accent`,
   `surface-raised`, `border-subtle`.
3. **Component tokens** — local exception: `button-bg`, `card-padding`.
4. **Components / patterns** — composition and behavior.
5. **Content / voice** — microcopy, tone, examples.

### 2. Healthy rules

- A semantic token should not point to another semantic token without a reason.
- Design states (hover, focus, disabled, selected) before the default.
- Measure contrast in the real context (background + overlay + image), not in
  isolation.
- Choose scales for rhythm, not round numbers: 4/8 px is a guide, not a
  religion.
- Document **when not to use** a component.
- Names describe purpose, not appearance (`danger`, not `red`).
- Dark mode is not inversion: recalibrate luminance, saturation and elevation.
- Every token should be traceable to a decision.

### 3. Tokens this pack can generate

- `assets/palettes/css/*.css` — variables per palette.
- `assets/palettes/css/role-tokens.css` — `background`, `surface`, `text`,
  `accent`, `accent-2` per palette.
- `assets/palettes/json/*.json` — source for Tailwind, CSS, GPL, Figma.
- `scripts/wallpaper palette IMAGE` — extracts a palette and produces JSON +
  CSS + GPL + swatches.
- `matugen` / `wallust` / `pywal16` — generate desktop themes from a wallpaper
  (see `wallpaper-tools.md`).

## Accessibility and visual design

- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Who Can Use](https://whocanuse.com/) — simulate vision and context.
- [The A11y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Accessibility.digital.gov](https://accessibility.digital.gov/)

## Documentation worth reading

- [Design Systems Handbook (InVision)](https://www.designbetter.co/design-systems-handbook)
- [Design Systems (Figma)](https://www.designsystems.com/)
- [Material 3 — Color roles](https://m3.material.io/styles/color/roles)
- [Material 3 — Typography](https://m3.material.io/styles/typography/overview)
- [Carbon — Color tokens](https://carbondesignsystem.com/elements/color/overview/)
- [Primer — Design tokens](https://primer.style/foundations/primitives/color)
- [Atlassian — Design tokens](https://atlassian.design/foundations/tokens)
- [Nielsen Norman Group — Design Systems](https://www.nngroup.com/articles/design-systems-101/)
