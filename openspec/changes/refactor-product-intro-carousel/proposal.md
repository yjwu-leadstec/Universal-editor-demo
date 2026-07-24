# Change: Rename and align the product intro carousel

## Why

The current `feature-media-section` block only partially implements the Li-L6 Pencil section `3 / 内容展示`. It flattens grouped highlights, has no attached bottom metric strip or header video link, collapses spacing variants at several breakpoints, hard-codes light-theme tab colors, and does not preserve the authored media ratio in the tabbed layout.

## What Changes

- **BREAKING** Rename the canonical block and Universal Editor model to `lixiang-product-intro-carousel`.
- Use a rendering-only `feature-media-section` compatibility entry only during the staged rollout, then remove it after all AEM content is migrated.
- Add nested highlight groups and an attached 3–4 item bottom metric strip as separate content structures.
- Add the optional header video link shown in the design.
- Correct theme colors, spacing presets, media ratios, dynamic tab indicator sizing, reduced-motion behavior, and duplicate ARIA IDs.
- Preserve the source-backed `default`, `overview`, `three-up`, `image-grid`, `expandable`, `primary-metric`, and `stat` layouts; remove the unsupported `overlay-tabs` option.

## Impact

- Affected specs: `product-intro-carousel`
- Affected code: `blocks/lixiang-product-intro-carousel/`, `scripts/product-block-utils.js`, Universal Editor models/definitions/filters, Li-L6 documentation and test fixtures.
- Content migration: migrate every `feature-media-section` and `feature-media-item` node under `/content/demo-site` to the canonical container and slide models, then remove the temporary compatibility entry.
