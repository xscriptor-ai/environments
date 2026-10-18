# Design-system references

| System | Study for |
|---|---|
| Material 3 | dynamic color from image, tonal roles, adaptive layouts |
| Apple HIG | hierarchy, typography, materials, gestures, accessibility |
| IBM Carbon | tokens, grid, accessibility, governance |
| Adobe Spectrum | scales, color, iconography, component docs |
| Shopify Polaris | product language, content, commerce patterns |
| Atlassian Design System | scales, tokens, complex products |
| GitHub Primer | foundations, components, open-source accessibility |
| Microsoft Fluent 2 | materials, elevation, motion, cross-platform |
| GOV.UK Design System | clarity, content, accessibility as requirement |
| U.S. Web Design System | tokens, utilities, government-grade components |
| Ant Design | dense product patterns, color scales |
| Salesforce Lightning | tokens, theming, accessibility |
| BBC GEL | editorial language across platforms |
| Radix | accessible primitives, perceptual color scales |
| shadcn/ui | copy-paste components with CSS tokens |
| Base UI | headless primitives |
| Park UI | components with tokens/themes |
| Chakra UI | tokens, semantics, composition |

## Token model

```text
reference -> semantic -> component -> composition
```

Example:

```css
:root {
  --blue-500: #3b82f6;              /* reference */
  --color-accent: var(--blue-500);  /* semantic */
  --button-bg: var(--color-accent); /* component */
}
```

## Documentation template

- What it is.
- When to use / when not to use.
- Anatomy.
- States.
- Accessibility.
- Content guidelines.
- Code example.
- Do/don't.

## Governance

- One source of truth.
- One owner for tokens.
- Review checklist.
- Deprecation archive.
- Exceptions documented and named.
- Audit cadence.

Sources: https://m3.material.io/ · https://carbondesignsystem.com/ ·
https://polaris.shopify.com/ · https://primer.style/ ·
https://design-system.service.gov.uk/ · https://www.radix-ui.com/ ·
https://ui.shadcn.com/
