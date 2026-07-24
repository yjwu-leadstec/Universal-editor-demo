# Li L6 EDS blocks: content models

This document freezes the author-facing content structures used by the Li L6 block family. All models follow these rules:

- no authored row has more than four semantic cells;
- standalone content uses a block model; repeating content uses block/item definitions and filters;
- rich-media items are never represented as `item1`, `item2`, and so on;
- every block model includes an optional stable `id`;
- images use `image`/`imageAlt` pairs, links use `link`/`linkText`/`linkType`, and mobile media is an optional override;
- finite visual choices use `classes`/select values; authors never enter pixels or free-form CSS;
- absent optional fields are valid and produce no empty visual element.

## Shared field groups

### Responsive media

| Field | UE component | Required | Notes |
| --- | --- | --- | --- |
| `image` | `reference` | depends on block | Desktop/poster image |
| `imageAlt` | `text` | when image is informative | Semantically collapses with `image` |
| `mobileImage` | `reference` | no | Falls back to `image` |
| `mobileImageAlt` | `text` | no | Falls back to `imageAlt` |
| `video` | `reference` | no | Desktop MP4/WebM asset |
| `mobileVideo` | `reference` | no | Falls back to `video` |

### Link

| Field | UE component | Required | Notes |
| --- | --- | --- | --- |
| `link` | `aem-content` | yes when CTA is shown | Page, anchor, or external URL |
| `linkText` | `text` | yes when CTA is shown | Visible accessible label |
| `linkType` | `select` | no | `primary`, `secondary`, or `text` |

### Product style choices

Where relevant, `classes` is a grouped `multiselect` with finite values:

- theme: `light`, `dark`, `gray`;
- spacing: `space-large`, `space-small`, `space-none`;
- text: `light-copy`, `dark-copy`;
- media ratio: `ratio-16-9`, `ratio-235-100`, `ratio-4-3`;
- layout/position values defined by the individual block.

## Product Hero — standalone with CTA items

| Block fields | Purpose |
| --- | --- |
| `id`, `title`, `mobileTitle`, `subtitle` | Overlay copy; mobile fields are optional overrides |
| `image`, `imageAlt` | Required desktop poster/background media above `1024px`; one semantic alt description is shared across responsive compositions |
| `mobileImage`, `mobileImageAlt` | Optional poster at `720px` and below; falls back through the broader posters |
| `video`, `mobileVideo` | Optional muted preview media |
| `logo`, `logoAlt` | Optional vehicle wordmark |
| `showArrow`, `showVideoControl`, `showProgress` | Runtime controls |
| `classes` | light/dark copy and top/center/bottom alignment |

Child `product-hero-responsive-media` fields: optional `mediumImage` for `821–1024px` and `tabletImage` for `721–820px`. One child item carries both responsive compositions without exceeding the Universal Editor parent block cell limit.

Child `product-hero-cta` fields: standard link group. The filter permits responsive-poster and CTA items. The same model covers both captured `product-first` instances.

The four poster fields remain one semantic scene and therefore share one alt description. Runtime decoration merges their generated sources into one native responsive `picture`, so the browser downloads only the active breakpoint asset while Universal Editor retains each authored reference field.

## Product Sticky Nav — collection

Block fields: `id`, `carName`.

Child `product-sticky-nav-item` fields: `link`, `linkText`. One item list is used at all breakpoints; CSS owns wrapping/horizontal scrolling. The dialog description requires unique anchor targets.

## Highlight Carousel — collection

Block fields:

| Field | Type | Default |
| --- | --- | --- |
| `id`, `title`, `mobileTitle`, `description` | text/textarea/rich text | optional; title fields preserve manual line breaks |
| `autoPlay` | boolean | `true` |
| `interval` | number | `4`, validated 2–12 seconds |
| `showVideoControl`, `showProgress` | boolean | `true`; play/pause and its progress ring are independently configurable |
| `headingColor` | select | `black`; white/black semantic choices |
| `classes` | multiselect | `light`, `space-small` |

Child `highlight-slide` fields:

- responsive media group plus optional video;
- `eyebrow`, multiline `title`, `description`, multiline `note`;
- optional `copyColor`, `showNote`, and multiline `indicatorLabel`;
- `metricValue`, `metricUnit`, `metricLabel`;
- optional standard link group.

The dialog recommends three to four cards but the runtime accepts one or more, including the captured five-card L6 collection.

## Chapter Intro — standalone

| Field group | Fields |
| --- | --- |
| Copy | `id`, `eyebrow`, `title`, `mobileTitle`, `description`, `note` |
| Preview media | responsive media group |
| Full video | `fullVideo`, `playLabel` |
| Behavior | `loop`, `showVideoControl`, `showProgress` |
| Style | `classes`: theme, copy color, top/bottom, left/center |

No free-form coordinates are exposed. `fullVideo` is intentionally separate from the muted preview video.

## Li Xiang Product Intro Carousel — nested mixed collection

Block fields:

- `id`, `eyebrow`, `title`, `mobileTitle`, `description`, `videoLink`, `videoLinkText`;
- `variant`: `default`, `overview`, `three-up`, `image-grid`, `expandable`, `primary-metric`, `stat`;
- `autoPlay`, `interval`, `showVideoControl`, `showProgress`, `enableMotion`;
- `showHighlightTags`, `highlightTagColor`, `highlightUnitColor`;
- `openLabel`, `closeLabel` for the expandable variant;
- `accentColor` restricted by text validation to a hex color;
- `classes`: theme, spacing, copy color, ratio.

Child `lixiang-product-intro-slide` fields:

- responsive media group;
- `eyebrow`, `title`, `description`, `note`;
- standard link group;
- `primaryValue`, `primaryUnit`, `primaryLabel` for primary-metric layouts.

Nested `lixiang-product-intro-highlight-group` contains
`lixiang-product-intro-highlight` items with `value`, `unit`, `tag`, and
`description`. This preserves the source `topList[].topSublist[]` grouping.

Child `lixiang-product-intro-metric` fields are `unit`, `title`, and `value`.
These items represent the separate attached `bottomList`, not `topList`.

The container filter permits slides, highlight groups, and bottom metrics. The
highlight-group filter permits only highlight items. Item model identity, not
row order, determines the item type.

## Color Switcher — collection

Block fields: `id`, `title`, `mobileTitle`, `description`, `classes` (theme/spacing/copy).

Child `color-switcher-item` fields:

- `name`;
- `swatch` reference plus `swatchAlt`;
- responsive image/media group;
- optional `colorValue` text validated as a hex color.

The dialog describes a maximum of seven items. Runtime remains safe with additional items.

## Spec Table — nested collection

Block fields: `id`, `title`, `mobileTitle`, `description`, `variant` (`sections`, `tabbed`, `icon-grid`), `classes`.

Child `spec-group` fields: `groupKey`, `title`, `description`, responsive background image group, `note`. Its filter accepts `spec-row` children.

Child `spec-row` fields: `label`, `value`, `description`, `icon`, `iconAlt`.

The model is intentionally three-level because groups are independently selectable tabs/sections and rows must remain repeatable, semantic label/value data.

## Product Notes — collection

Block fields: `id`, optional `title`.

Child `product-note-item` field: one required `richtext` field named `text`. A repeated item is one legal note; authors do not maintain numbering fields.

## Text Columns — collection

Block fields: `id`, `title`, `mobileTitle`, `description`, `classes`.

Child `text-column-item` fields: `title`, `text` (`richtext`).

## Picture Group — nested collection

Block fields: `id`, `eyebrow`, `title`, `mobileTitle`, `description`, `classes`, `showVideoControl`, `showProgress`, `enableMotion`.

Child `picture-group-item` fields: `groupKey`, `title`, `mobileTitle`, `description`. Its filter accepts `picture-media-item` children.

Child `picture-media-item` fields: responsive media group plus `title`, `description`, `note`.

This three-level model preserves the source `contentList → sublist` relationship and lets each media item retain its instrumentation.

## Icon Overlay Showcase — nested collection

Block fields: `id`, `title`, `mobileTitle`, `description`, `classes`.

Child `overlay-panel` fields: `panelKey`, `title`, `description`, responsive image group, `mask`, `mobileMask`, `maskAlt`. Its filter accepts `overlay-hotspot` children.

Child `overlay-hotspot` fields:

| Field | Type | Validation |
| --- | --- | --- |
| `label`, `description` | text/rich text | label required |
| `icon`, `iconAlt` | reference/text | optional |
| `x`, `y`, `mobileX`, `mobileY` | number | 0–100 |

## Feature Grid — collection

Block fields: `id`, `eyebrow`, `title`, `mobileTitle`, `description`, `note`, `classes`.

Child `feature-grid-item` fields: responsive media group, `title`, `description`, optional standard link group. This replaces all numbered `imageUrlN` source fields.

## Product Parameter CTA — standalone

Fields: `id`, `title`, `mobileTitle`, `description`, responsive media group, primary link group (`link*`), secondary link group (`secondaryLink*`), and `classes`.

## Product Ending — standalone

Fields: `id`, `title`, responsive media group, optional preview video, primary link group, secondary link group, `showVideoControl`, and `classes`.

## Product Guide — collection

Block fields: `id`, optional `title`, `classes` with `desktop-visible`/`mobile-visible` choices.

Child `product-guide-item` fields: responsive image group, `title`, `description`, standard link group.

## Product Download — standalone

Fields: `id`, `title`, `description`, responsive image group, iOS link group (`iosLink*`), Android link group (`androidLink*`), and `classes`.

## Page share metadata

The existing `page-metadata` model gains:

| Field | Component | Purpose |
| --- | --- | --- |
| `ogTitle` | text | Optional social-title override |
| `ogDescription` | textarea | Optional social-description override |
| `ogImage` | reference | `product-home-share` image |
| `ogImageAlt` | text | Accessible description of the share image |

When override text is absent, page title/description remain the content fallback.

## Model validation checklist

- All visual blocks are registered under the `section` filter.
- Every container definition has a matching filter and every item definition uses the block-item resource type.
- No definition/model/filter ID is duplicated.
- All paired image/link fields follow semantic-collapse naming.
- Every boolean and number has the schema-enforced `valueType`.
- Hotspot numbers use 0–100 validation; autoplay intervals use 2–12 validation.
- `classes` multiselects use `valueType: string`, matching the Universal Editor schema.
- `npm run build:json` must produce root files containing all block and item IDs before implementation is considered model-complete.
