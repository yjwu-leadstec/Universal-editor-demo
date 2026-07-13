# Li L6 EDS blocks: analysis and acceptance criteria

## Objective

Build the complete Li L6 product-page block family in this repository. The implementation must:

- represent every visible Li L6 source component;
- include the product-family blocks shown in the Li L6 Pencil designs even when the current L6 page does not use them;
- provide authorable Universal Editor dialogs for every visible block;
- preserve Universal Editor instrumentation after decoration;
- reproduce the reference layouts, responsive behavior, and interactions;
- provide reduced-motion, keyboard, missing-content, and media-failure fallbacks;
- be demonstrated on both a real Li L6 page and an all-components test page in `leadstec-dev`.

OpenSpec is intentionally not used for this work.

## Sources and priority

1. Current public Li L6 page and the captured `global-en/l6/index.html` are the behavioral/content source of truth.
2. `docs/pencil/Li-L6.pen`, read only through Pencil MCP, defines the component layouts and author-controlled design options.
3. `eds-reference/product-l6.html`, `assets/data/product-l6-scenes.js`, and the product model/requirement documents provide the EDS decomposition and interaction reference.
4. Existing blocks in this repository define local implementation conventions, generated model structure, and Universal Editor instrumentation handling.

When the sources disagree, the current public page wins for runtime behavior, Pencil wins for explicitly designed reusable variants, and the reference documents guide the EDS authoring model.

## Source inventory

The captured Li L6 `pmsData` contains 37 component instances:

| Source type | Count | EDS representation |
| --- | ---: | --- |
| `product-first` | 2 | `product-hero` |
| `SceneTableHorizontal` | 1 | `highlight-carousel` |
| `SceneBeginning` | 6 | `chapter-intro` |
| `SceneMegaContentTableX` | 18 | `feature-media-section` |
| `SceneMegaContentMultipleImage` | 1 | `feature-media-section` (`image-grid`) |
| `ScenePictureGroup` | 1 | `picture-group` |
| `product-common-summary-detail` | 1 | `spec-table` (`tabbed`) |
| `product-power` | 1 | `spec-table` (`icon-grid`) |
| `product-ending` | 1 | `product-ending` |
| `SceneGuide` | 1 | `product-guide` |
| `product-download` | 1 | `product-download` |
| `product-home-share` | 1 | page metadata, not a visible block |
| `SceneMegaContentNote` | 1 | `product-notes` |
| `product-l7-subheader` | 1 | `product-sticky-nav` |

The Pencil document contains eight reusable design families: hero, highlight carousel, content display, image-over switcher, big/small image composition, single-image text overlay, multi-image composition, and ending/flagship configuration. These designs add five product-family blocks or variants that are not present as source instances on the captured L6 page: `color-switcher`, `text-columns`, `icon-overlay-showcase`, `feature-grid`, and `product-param-cta`.

## Delivery scope

### Visible blocks

1. `product-hero`
2. `product-sticky-nav`
3. `highlight-carousel`
4. `chapter-intro`
5. `feature-media-section`
6. `color-switcher`
7. `spec-table`
8. `product-notes`
9. `text-columns`
10. `picture-group`
11. `icon-overlay-showcase`
12. `feature-grid`
13. `product-param-cta`
14. `product-ending`
15. `product-guide`
16. `product-download`

### Non-visible content

`product-home-share` is page metadata. The page model must expose an Open Graph image field so authors can maintain the captured source value without rendering an empty visual block. Existing page title and description fields remain the Open Graph text fallback.

## Shared acceptance criteria

### Functional requirements

- Every block exports a default `decorate(block)` function and loads through the standard EDS block loader.
- Every block has a distributed `_block.json` that generates valid definitions, models, and filters.
- Every visible block is registered in the section filter; every container accepts only its declared item type.
- Every block has a stable optional `id` field for anchors and automated validation.
- Every image has authorable alt text. Every video has a poster/fallback image.
- Optional author fields do not leave empty DOM shells, blank controls, or unexplained spacing.
- `moveInstrumentation()` transfers block, property, and item `data-aue-*` attributes to the final semantic DOM.
- Interactions are scoped to their block instance; multiple instances on one page do not share mutable state.
- Buttons and links use authored URLs and meaningful labels; disabled or incomplete CTAs are omitted.

### Motion and media requirements

- Product sections reveal with opacity/translate transitions driven by `IntersectionObserver`.
- Media switches use opacity/transform transitions without layout shifts.
- Video-capable blocks expose a top-right play/pause control and optional progress ring/bar.
- Autoplay video is muted and inline. Media failure preserves the poster image and does not throw.
- `prefers-reduced-motion: reduce` disables autoplay, parallax, and non-essential transitions while preserving all content and controls.
- Carousels and automatic tab sequences pause on hover, keyboard focus, page visibility loss, and manual interaction.

### Accessibility and keyboard requirements

- All icon-only controls have accessible names and visible focus styles.
- Tabs implement `tablist`, `tab`, `tabpanel`, `aria-selected`, roving `tabindex`, Arrow keys, Home, and End.
- Dialogs move focus to the close control, trap Tab/Shift+Tab, close on Escape/backdrop, lock body scrolling, and restore focus to the trigger.
- Carousels expose status and slide position without announcing every autoplay transition.
- Touch targets are at least 44px on mobile.
- Semantic headings remain in document order and all informative images have non-empty alt text.

### Edge cases

- One-item collections render without broken navigation; empty collections show no controls.
- Long desktop/mobile headings wrap without overflow and preserve explicit line breaks.
- Missing mobile media falls back to desktop media; missing video falls back to its poster.
- Missing captions, notes, metrics, secondary CTAs, or optional labels collapse cleanly.
- Collection code handles additional items without throwing. Dialog descriptions communicate recommended limits where the UE schema cannot enforce item counts.
- Invalid hotspot percentages are clamped to `0–100` at runtime in addition to dialog validation.

### Responsive requirements

- Large desktop (`1441px+`): use the 1920px Pencil proportions and a content width near 1480–1600px.
- Medium (`720–1440px`): preserve desktop information hierarchy while reducing columns and spacing; do not simply scale the desktop canvas.
- Mobile (`719px-`): use mobile-specific media when supplied, single-column or horizontal-snap layouts, and 60/80px spacing presets.
- Required validation viewports are 1920, 1440, 1024, and 390px.
- Every viewport has zero horizontal page overflow, overlapping text, inaccessible controls, or clipped focus rings.

## Block-specific acceptance criteria

### Product Hero

- Full-viewport desktop/mobile background media uses cover positioning and a static poster fallback.
- Logo, title, optional subtitle, and up to five CTAs overlay the media with light/dark copy variants.
- The optional scroll cue scrolls to the next content section and disappears when disabled.
- Both captured `product-first` instances render through the same authoring model.

### Product Sticky Nav

- Car name and one authored anchor list are reused at every viewport.
- The bar becomes sticky after the product hero, compensates for the global header, and is horizontally scrollable on mobile.
- Clicking an item smooth-scrolls to its section; `IntersectionObserver` updates the current item and `aria-current`.
- Duplicate/missing targets do not break navigation.

### Highlight Carousel

- Desktop uses the Pencil coverflow composition: active center card plus previous/next context, looped navigation, arrows, and progress.
- Desktop may auto-advance every four seconds. Mobile is manual horizontal snap scrolling with no autoplay.
- Cards support desktop/mobile media, title, description, metrics, label, and optional note; card copy heights align to the longest item.
- The current Li L6 five-card data works even though the authoring guidance recommends three to four cards.

### Chapter Intro

- Full-screen preview media supports top/bottom and left/center copy positions through finite variants.
- Desktop and mobile titles/media can be authored independently, with graceful fallback.
- The full-video CTA opens an accessible media dialog with native controls and correct focus restoration.
- Background preview playback, looping, and the top-right progress control respect reduced motion.

### Feature Media Section

- Supported layouts are `default`, `overview`, `three-up`, `image-grid`, `expandable`, `primary-metric`, `stat`, and `overlay-tabs`.
- The block supports independent desktop/mobile titles and media, light/dark/gray backgrounds, light/dark text, 16:9/2.35:1/4:3 media, and large/small/none spacing.
- Default/overlay tab layouts auto-advance every four seconds and support manual keyboard switching.
- `image-grid` implements the Pencil big/small and multi-image compositions; media remains proportional and parallax is contained inside the frame.
- `expandable` toggles authored open/close labels and keeps state keyboard accessible.
- Metrics and item copy are optional and never create blank panels.

### Color Switcher

- Authors can add one to seven color items with swatch, name, desktop/mobile media, and alt text.
- Selecting a color changes only the media and color name; the section title/description remain stable.
- Selection is keyboard operable and media cross-fades. Mobile swatches are centered and horizontally scroll when necessary.

### Spec Table

- `sections`, `tabbed`, and `icon-grid` variants share semantic group and row data.
- Tabbed navigation follows the shared keyboard contract; mobile uses an accessible stacked/scrollable layout without compressing labels.
- Section groups may include responsive background media and notes; icon-grid rows may include accessible icons.
- Label/value content is represented semantically and remains readable when optional media is absent.

### Product Notes

- Rich-text legal notes render as an ordered semantic list when multiple items exist.
- Links and superscript markers remain usable; long legal text wraps at every viewport.

### Text Columns

- A repeated title/body collection renders up to three columns on large screens, two on medium screens, and one on mobile.
- Missing item titles do not remove their body content.

### Picture Group

- Group tabs switch between two-level media collections and follow the shared keyboard contract.
- Each group supports its own title and a responsive masonry/big-small media layout.
- Media can be image or video, uses poster fallbacks, and remains instrumented at group and item level.

### Icon Overlay Showcase

- Each showcase panel supports responsive background/mask media and repeated hotspots.
- Desktop/mobile hotspot coordinates are authorable percentages with `0–100` validation.
- Hotspots are keyboard buttons that reveal accessible labels/details; overlays remain inside the media frame.

### Feature Grid

- Repeated feature cards replace numbered source image fields and support image/video, title, description, and optional note.
- Large desktop uses three columns, medium uses two, and mobile uses one or two according to available width.
- Light/dark/gray themes and spacing presets match the Pencil ending/flagship configuration family.

### Product Parameter CTA

- Responsive vehicle media, title, description, primary CTA, and optional secondary link form a standalone parameter-page entry.
- The block links to the parameter destination and never duplicates the full specification table.

### Product Ending

- A responsive full-width CTA banner supports title, primary/secondary links, media fallback, and light/dark copy.
- Buttons stack on mobile and remain at least 44px high.

### Product Guide

- Repeated guide cards support responsive background media, title, description, and CTA.
- Authors can control web/mobile visibility through finite classes; the captured L6 mobile-only case is supported.

### Product Download

- Responsive background media and optional title/description frame iOS and Android download links.
- Missing store links omit their buttons; an otherwise empty source instance renders no broken controls.

## Test-content requirements

Two test surfaces are required:

1. **Li L6 page** — all captured visible L6 instances in source order, using real captured text/media and the second `product-first` instance.
2. **All-components page** — every block/variant absent from the captured page, plus edge cases: one item, missing optional fields, long headings, image-only media, video failure fallback, maximum hotspots/colors, and reduced-motion-compatible controls.

Temporary local `.plain.html` content is allowed for development, but final validation must use corresponding `leadstec-dev` AEM pages and branch preview URLs.

## Definition of done

- All 16 visible blocks and the share metadata field are implemented and generated into the root component JSON files.
- Local real-content and all-components pages load through AEM CLI.
- Lint and JSON build pass; any existing test command passes or its absence is recorded.
- Browser validation proves all four viewports, all interactive flows, zero console errors, and zero horizontal overflow.
- The two `leadstec-dev` pages contain the expected block/item JCR structure and render correctly in preview/Universal Editor.
- The feature branch is committed and pushed; a PR contains both preview links; GitHub build and preview checks are green.

