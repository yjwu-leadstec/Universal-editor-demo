# Homepage: latest-design analysis and acceptance criteria

## Objective

Create the English homepage in the deployable EDS repository and author its real content at
`/content/demo-site/language-master/en/homepage`. The implementation reuses the existing homepage
block family and updates the authored media/content to the latest Pencil design.

## Authoritative sources

1. `lixiang2/docs/pencil/homepage/homepage.pen`, read only through Pencil MCP.
2. Figma `Liauto` file `k1DveXGZ77cpO2RKpw49eT`, node `0:1`.
3. `lixiang2/eds-reference/assets/data/site-data.js` for official English copy.
4. Existing Universal Editor models and block implementations in this repository.

The final desktop artboard is `HVhc3` (`PC-Homepage`, 1920 px) and the mobile artboard is
`KUXKP` (`M-homepage`, 375 px). Navigation and footer are global fragments and are not authored
inside the page body.

## Page composition

The authored block order is fixed to the latest design:

1. `home-vehicle-grid`
2. `home-banner` (`hide-mobile`)
3. `home-carousel story`
4. `home-product-list`
5. `home-carousel tech`

Desktop uses a two-row four-column vehicle composition, a three-slide full-width banner, a
three-card story carousel, two product panels, and an eight-card technology carousel. At 820 px
and below, vehicle tiles stack vertically, the desktop banner is hidden, carousels become a
single-card mobile flow, and product panels stack.

## Content requirements

- Vehicle order: Li i6, Li i8, Li MEGA, Li L6, Li L7, Li L8, Li L9.
- Vehicle positioning copy must match the official English brand strings recorded in
  `lixiang2/AGENTS.md`.
- Vehicle media uses the same-folder Pencil assets `i6 pc.jpg`, `i8 pc.jpg`, `MEGA pc.jpg`,
  `L6 pc.jpg`, `L7 pc.jpg`, `L8 pc.jpg`, and `L9 pc.jpg`.
- Li i6 uses `figma-2-2961-m-home-hero.jpg` as its mobile override; other vehicle tiles fall back
  to their desktop media when no mobile override is authored.
- Banner media uses Figma exports 1069, 1068, and 1067 in that order. All three slides promote
  Li MEGA with the official positioning line.
- Story title is `Li Auto: Cars, Home, Alive.` and the three official English card titles/videos
  are retained.
- Product panels use `We Create Mobile Homes` and `Users Create Happy Homes` with the existing
  DAM `columns` assets.
- Technology uses all eight official English cards and the eight existing DAM images.

## Acceptance criteria

- The page exists under the configured English AEM Author content root and contains exactly the
  five visible homepage blocks in the required order.
- No empty Universal Editor item nodes remain in the page content tree.
- Every authored image reference resolves to an existing DAM asset.
- The page title, navigation title, and description identify the Li Auto global homepage.
- All repeated items keep the existing model IDs and `core/franklin` resource types so Universal
  Editor instrumentation remains available after block decoration.
- Desktop (1920/1440), medium (1024), and mobile (390) render without horizontal overflow,
  overlapping copy, missing images, or console errors.
- Vehicle hover/focus reveals the CTA treatment, Banner rotates and exposes dots, and both
  carousels respond to arrow/dot navigation. Reduced-motion fallbacks remain intact.

## Delivery decision

No new block family is required. The existing four homepage block types already represent the
latest design; this delivery is primarily correct AEM composition and content. Code changes are
only justified if final rendering exposes a design or runtime defect.
