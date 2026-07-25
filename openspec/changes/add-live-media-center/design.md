## Context

Production `https://www.liauto.com/news.html` is the visual and behavioral source of truth. Its Photos and Videos tabs navigate to `picture.html` and `video.html`; they are not same-page panels. The existing EDS media implementation follows a design reference that intentionally differs from this behavior.

The existing Author page has one featured item and two newsroom cards. It has no representation of the current seven Newsroom cards, six photo albums, or the current video catalogue. Code alone cannot establish content parity.

## Goals / Non-Goals

- Goals: reproduce the live list-page hierarchy, responsive card layout, route tabs, hover/focus interaction, and author-editable data.
- Goals: use independent blocks so old media prototype styles and detail dialogs do not leak into the live-aligned page.
- Non-goals: make runtime browser requests to liauto.com for editorial content.
- Non-goals: redesign or modify article, album, or video detail pages in this change; cards expose authored links for their destinations.

## Decisions

### Independent components

Use two blocks rather than adapting the old prototype components:

1. `live-media-header` is a standalone block containing the page title and the three route links.
2. `live-media-grid` is a collection block containing the cards for the current route.

This isolates the live layout from `styles/media-center.css`, whose featured-card/modal assumptions are incompatible with the live page.

### Content model

`live-media-header` fields:

| Field | Required | Purpose |
| --- | --- | --- |
| title | yes | Page heading, normally `Newsroom` |
| activeTab | yes | `newsroom`, `photos`, or `videos` |

`live-media-route` collection fields:

| Field | Required | Purpose |
| --- | --- | --- |
| tabKey | yes | `newsroom`, `photos`, or `videos` |
| href | yes | Corresponding route |

`live-media-grid` fields:

| Field | Required | Purpose |
| --- | --- | --- |
| type | yes | `newsroom`, `photos`, or `videos` |
| id | no | Stable section anchor |

`live-media-card` collection fields (four cells maximum):

| Field | Required | Purpose |
| --- | --- | --- |
| title | yes | Card title |
| date | yes | Publication date |
| image | yes | DAM cover image |
| link | yes | Destination route |

`live-media-card-meta` collection fields:

| Field | Required | Purpose |
| --- | --- | --- |
| title | yes | Exactly matches the title of the card it supplements |
| quantity | no | Photo item count |
| duration | no | Video duration |
| imageAlt | no | Accessible image label |

The model remains predictable and each row has four fields or fewer. Newsroom uses only title/date/image/link; Photos uses quantity; Videos uses duration.

### Layout contract from production

- Desktop: header starts below the 50px global header; content width is 1480px with 220px side margins at 1920px.
- Desktop grid: two 728px columns, 24px gap, white cards with 12px radius, image aspect ratio 728:409.5, and a 264px text region with 30px padding.
- Mobile: 20px page gutters, one 350px card column at 390px, image height 196.875px, 16px text padding, title 16px/24px and date 12px/20px.
- Tabs navigate to the three routes, show the active-state underline, and have a keyboard-visible focus state.

## Risks / Trade-offs

- Current Author data is incomplete. The UI can be completed locally, but pixel/content parity on deployed pages requires an explicit AEM content migration and publishing step.
- Live production content may change over time. Authors must update the AEM collection as part of editorial workflow; code does not silently scrape the production website.
- The old page uses modal details. Keeping it intact until migration prevents breaking the current page during rollout, but requires a deliberate switch-over after content is ready.

## Migration Plan

1. Add the new blocks and Universal Editor models.
2. Create and populate the three Media Center route pages in AEM from the current live card catalogue and DAM assets.
3. Validate Preview at 1920, 1440, 1024, 768, and 390px against the live pages.
4. Replace the old Media Center sections on the approved routes, publish, and retain the old block code until no other page references it.

## Open Questions

- Confirm the approved EDS paths for the Photos and Videos route pages. The proposal assumes `/language-master/en/media-center/photos` and `/language-master/en/media-center/videos` to mirror the live three-route behavior.
- Confirm whether the linked article/album/video detail routes must be rebuilt in this same change or may remain authored destinations for a later dedicated detail-page change.
