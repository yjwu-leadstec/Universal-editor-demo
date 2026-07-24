## Context

Li-L6 Pencil nodes `SdaWn`, `YAfqr`, and `pwCcp` define three responsive compositions for section `7 / 多图`. Node `y6yvQ5` requires white/gray themes and scroll-linked image movement. Node `kicca` further requires optional copy, image/video media, responsive spacing choices, and source media large enough to support parallax.

The current block already preserves Universal Editor instrumentation and supports nested media items, so the content hierarchy can be retained while its canonical identities and presentation are corrected.

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

- Keep the existing three-level content hierarchy to avoid destructive item reparenting, but rename all three models to the product-specific namespace.
- Use a nine-track proportional desktop/tablet grid. This reproduces the approved 620/460/300px left column and 460/460/460px right column at 1920px, scaling to the 768px board.
- Use a thirteen-track mobile grid to reproduce the independent left and right staggered columns on the 375px board.
- Use component-scoped spacing overrides: desktop 160/80px, tablet 64/32px, and mobile 80/40px for large/small.
- Render the section header only from 720px upward because the approved mobile board contains the media mosaic only.
- Render images on a centered 1.4× canvas and move them vertically; stop scroll-linked motion under `prefers-reduced-motion`.
- Keep nested set labels for Author organization and multi-set accessibility, while a single set renders without tabs.

## Risks / Trade-offs

- Existing published content will request the old block until migration and publication complete. Mitigation: deploy the canonical code first, then migrate all three known content trees, verify zero legacy identities, and publish the active Li-L6 page.
- Fixed design proportions can expose unusual results with fewer or more than eight media items. Mitigation: document and test the approved eight-item authoring contract; extra items fall back below the designed mosaic.
- Hiding the header on mobile intentionally follows the selected 375px Pencil board. Desktop and tablet copy remain authorable and visible.

## Migration Plan

1. Add the canonical block, models, filters, parser mappings, allow-list, and tests.
2. Build and deploy the generated component JSON and block source.
3. Update the three known container nodes and their nested set/media item metadata.
4. Verify active, aligned, and backup content return only canonical identities.
5. Remove the old block directory and legacy parser/allow-list identities.
6. Publish and validate the active Li-L6 page in Author and EDS Preview.

