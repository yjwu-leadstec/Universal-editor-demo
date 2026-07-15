# Homepage: authored content model

## Page

| Property | Value |
| --- | --- |
| JCR path | `/content/demo-site/language-master/en/homepage` |
| Template | `/libs/core/franklin/templates/page` |
| Resource type | `core/franklin/components/page/v1/page` |
| Title / nav title | `Li Auto` / `Home` |
| Description | `Explore Li Auto family vehicles, stories, and technologies.` |

## Block composition

| Order | Block node | Model / variant | Repeated items |
| ---: | --- | --- | ---: |
| 1 | `home-vehicle-grid` | `home-vehicle-grid` | 7 `vehicle-tile` |
| 2 | `home-banner` | `home-banner` | 3 `banner-slide` |
| 3 | `home-carousel-story` | `home-carousel`, class `story` | 3 `carousel-card` |
| 4 | `home-product-list` | `home-product-list` | 2 `product-panel` |
| 5 | `home-carousel-tech` | `home-carousel`, class `tech` | 8 `carousel-card` |

## Vehicle tiles

Each item uses `image`, `imageAlt`, optional `mobileImage`, optional `mobileImageAlt`, `logo`,
`vehicleName`, `subtitle`, `size`, `kind`, and `link`. The `size` field is authored independently
per card and supports `large` (two desktop columns) or `small` (one desktop column). The current
content sets Li i6 to `large` and all remaining items to `small`; all are `vehicle` kind. Missing
mobile media falls back to the desktop background.
The authored logo references reuse the existing transparent DAM wordmarks.

## Banner slides

Each item uses `image`, `imageAlt`, `logo`, `title`, `subtitle`, `link`, and `linkText`. The block
remains visible on mobile and uses the responsive portrait layout defined by `home-banner.css`.
The three slides reuse the Li MEGA wordmark but have independent image and alt text.

## Story and technology carousels

Both instances use `home-carousel`; `classes` selects `story` or `tech`.

- Story block fields: `heading`, `mobileHeading`; cards use image/poster, video, title, and action.
- Technology block fields: `eyebrow`, `heading`; cards use image, alt text, and title.
- Official technology order: Driver Assistance, Smart Space, AI Assistant, Driving Experience,
  Fortress Safe Body, Fast Charging, OTA, Halo OS.

## Product panels

Each `product-panel` uses `image`, `imageAlt`, `title`, `link`, and `linkText`. Existing DAM assets
under `/content/dam/li-demo/columns` are the canonical panel media.

## Authoring invariants

- Image alt fields remain paired with their base reference fields; link text remains paired with
  its link field so Crosswalk semantic folding is preserved.
- Repeating content is represented only by block/item nodes—no numbered fields or empty template
  items.
- The block order in the JCR section is part of the page design and must not be changed when
  editing individual items.
- If product detail pages are unavailable in the current language root, their links fall back to
  the language homepage instead of pointing at a nonexistent local page.
