## 1. Baseline and specification

- [x] 1.1 Read the selected Pencil nodes and record desktop, tablet, mobile, and requirement geometry.
- [x] 1.2 Inventory repository references and all AEM content instances.
- [x] 1.3 Define the canonical component, serializable sibling item grammar, dialog contract, and migration plan.

## 2. Component and dialog

- [x] 2.1 Rename the block directory, JS, CSS, and Universal Editor partial.
- [x] 2.2 Rename the container, set, and media item definitions/models/filters.
- [x] 2.3 Align dialog themes, responsive spacing, header-media spacing, optional copy, media, controls, captions, and parallax settings.
- [x] 2.4 Update fallback parser mappings and the section allow-list.

## 3. Visual and interaction alignment

- [x] 3.1 Implement the approved 1480×1420 desktop/tablet proportional mosaic.
- [x] 3.2 Implement the approved 335×771 mobile staggered mosaic.
- [x] 3.3 Align header geometry, typography, captions, square corners, and component-specific spacing.
- [x] 3.4 Render the centered 1.4× image canvas and reduced-motion-safe parallax.
- [x] 3.5 Preserve Universal Editor instrumentation, ordered set/media siblings, offscreen lazy images, video controls, tabs, and responsive media.

## 4. Tests and generated integration

- [x] 4.1 Add regression tests for canonical identity, dialog fields, exact geometry, parallax, and legacy removal.
- [x] 4.2 Update Li-L6 analysis, audit, content-model, and component-manual references.
- [x] 4.3 Rebuild generated component JSON.
- [x] 4.4 Run tests, JS/CSS lint, JSON build, and strict OpenSpec validation.

## 5. AEM migration and visual verification

- [x] 5.1 Deploy the canonical source and generated component configuration.
- [x] 5.2 Migrate active, aligned, and backup Li-L6 container/set/media metadata.
- [x] 5.3 Verify repository and `/content/demo-site` contain zero legacy `picture-group` identities.
- [x] 5.4 Publish the active Li-L6 page.
- [x] 5.5 Verify Author and Preview at 1920, 1440, 1024, 768, and 390px with no block errors, component console errors, or horizontal overflow.
- [x] 5.6 Record final migration and visual evidence.
