## Context

Li-L6 Pencil nodes `SdaWn`, `YAfqr`, and `pwCcp` define three responsive compositions for section `7 / 多图`. Node `y6yvQ5` requires white/gray themes and scroll-linked image movement. Node `kicca` further requires optional copy, image/video media, responsive spacing choices, and source media large enough to support parallax.

Universal Editor serializes one item level below an EDS block. The previous three-level set/media hierarchy therefore left nested media out of `.plain.html`; the canonical model must keep set markers and media items as ordered siblings directly below the block.

## Goals / Non-Goals

- Goals:
  - Use one unambiguous product-specific canonical component identity.
  - Match the approved desktop, tablet, and mobile geometry.
  - Keep existing authored content and instrumentation intact through migration.
  - Make every visible dialog option map to rendered behavior.
- Non-Goals:
  - Reuse the product-specific block as a generic homepage or brand gallery.
  - Add unsupported dark-background or rounded-card variants.
  - Depend on Dynamic Media or Scene7 URLs.

## Decisions

- Keep the three product-specific models, but serialize set markers and media items as ordered block-level siblings. A set marker starts a picture set and each following media item belongs to it until the next marker.
- Use a nine-track proportional desktop/tablet grid. This reproduces the approved 620/460/300px left column and 460/460/460px right column at 1920px, scaling to the 768px board.
- Use a thirteen-track mobile grid to reproduce the independent left and right staggered columns on the 375px board.
- Use component-scoped spacing overrides: desktop 160/80px, tablet 64/32px, and mobile 80/40px for large/small.
- Render the section header only from 720px upward because the approved mobile board contains the media mosaic only.
- Render images on a centered 1.4× canvas and move them vertically; stop scroll-linked motion under `prefers-reduced-motion`.
- Keep set labels for Author organization and multi-set accessibility, while a single set renders without tabs. The block filter accepts both set markers and media items so Universal Editor can author the serializable sibling grammar.
- Treat lazy offscreen images as pending rather than broken. Recovery is driven by the browser error event; the shared media helper must not remove deep-page Author images after an arbitrary one-second timeout.

## Risks / Trade-offs

- Existing published content will request the old block until migration and publication complete. Mitigation: deploy the canonical code first, then migrate all three known content trees, verify zero legacy identities, and publish the active Li-L6 page.
- Fixed design proportions can expose unusual results with fewer or more than eight media items. Mitigation: document and test the approved eight-item authoring contract; extra items fall back below the designed mosaic.
- Hiding the header on mobile intentionally follows the selected 375px Pencil board. Desktop and tablet copy remain authorable and visible.
- Author images are far below the initial viewport on Li-L6. A timeout-based broken-image heuristic produced false fallbacks there; explicit load errors remain recoverable without racing lazy loading.

## Migration Plan

1. Add the canonical block, models, filters, parser mappings, allow-list, and tests.
2. Build and deploy the generated component JSON and block source.
3. Update the three known container nodes and set/media item metadata, then lift media nodes to ordered block-level siblings.
4. Verify active, aligned, and backup content return only canonical identities.
5. Remove the old block directory and legacy parser/allow-list identities.
6. Publish and validate the active Li-L6 page in Author and EDS Preview.
