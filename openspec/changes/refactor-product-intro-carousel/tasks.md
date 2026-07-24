## 1. Baseline and model

- [x] 1.1 Tag the clean pre-change milestone.
- [x] 1.2 Add the canonical container, slide, highlight-group, highlight, and bottom-metric models.
- [x] 1.3 Keep a rendering-only adapter for published legacy markup.

## 2. Rendering and interaction

- [x] 2.1 Render grouped highlights without flattening group relationships or empty fields.
- [x] 2.2 Render the optional attached bottom metric strip and optional header video link.
- [x] 2.3 Preserve source-backed variants and remove unsupported authoring variants.
- [x] 2.4 Make tab IDs unique and disable autoplay when reduced motion is requested.

## 3. Visual alignment

- [x] 3.1 Correct light/dark tab colors and theme-aware rules.
- [x] 3.2 Restore distinct spacing presets at every breakpoint.
- [x] 3.3 Honor 16:9, 2.35:1, and 4:3 ratios on desktop and mobile.
- [x] 3.4 Make the indicator expand with labels while retaining the 98px minimum.

## 4. Integration and verification

- [x] 4.1 Update fallback field maps, section filters, fixtures, docs, and generated JSON.
- [x] 4.2 Add regression tests for the canonical block and legacy adapter.
- [x] 4.3 Run strict OpenSpec validation, tests, lint, and JSON build.
- [x] 4.4 Verify representative layouts at 1920, 1440, 1024, 768, and 390 widths.

## 5. Complete AEM migration

- [x] 5.1 Inventory every legacy container and child node under `/content/demo-site`.
- [x] 5.2 Deploy the canonical component with the temporary runtime adapter.
- [x] 5.3 Migrate all legacy container and child nodes, including JCR node names and model metadata.
- [ ] 5.4 Publish and verify all affected pages with real migrated Author content.
- [x] 5.5 Remove the legacy block directory and parser mappings.
- [x] 5.6 Verify the legacy AEM query and repository production-source search both return zero identities.
- [ ] 5.7 Re-run generated JSON, tests, lint, strict OpenSpec validation, and multi-breakpoint delivery checks.
