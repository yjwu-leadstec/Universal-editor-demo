# Change: Rename and align the product detail picture group

## Why

The current generic `picture-group` block is the implementation of Li-L6 Pencil section `7 / 多图（产品细节图组）`, but its identity, Universal Editor dialog, equal-row grid, header alignment, mobile layout, spacing presets, captions, and parallax image sizing do not match the approved design.

## What Changes

- **BREAKING** Rename the canonical block and its Universal Editor models to the `lixiang-product-detail-picture-group` namespace.
- Migrate all existing `Picture Group` content under `/content/demo-site`, including container/item metadata and media reparenting to the serializable block-item level.
- Align the dialog with the approved white/gray themes, responsive outer spacing, header-to-media spacing, optional copy, responsive image/video fields, controls, captions, and parallax behavior.
- Rebuild the desktop/tablet mosaic as the approved 1480×1420 proportional layout and the mobile mosaic as the approved 335×771 staggered layout.
- Correct header width/offset, typography, caption alignment, square media corners, 1.4× parallax image canvas, and reduced-motion behavior.
- Remove the old `picture-group` runtime, model, filter, parser, allow-list, documentation, and test identities after migration.

## Impact

- Affected specs: `product-detail-picture-group`
- Affected code: `blocks/lixiang-product-detail-picture-group/`, `scripts/product-block-utils.js`, `models/_section.json`, generated component JSON, tests, and Li-L6 component documentation.
- Content migration: three existing container nodes and their group/media item metadata under the Li-L6 active, aligned, and backup pages.
