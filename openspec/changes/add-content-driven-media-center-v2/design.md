## Context

Each media item is a publishable detail page below `/media-library`. The metadata on that page is the only editorial record for title, cover image, visibility, ordering, and list layout.

## Decisions

- Use EDS `query-index.json` rather than a runtime request to the public Li Auto site or a manually duplicated card collection.
- Use `mediaType`, `visible`, `displayMode`, `featured`, `sortOrder`, `publishDate`, `coverImage`, `imageAlt`, `photoCount`, and `videoDuration` as detail-page metadata.
- Treat `displayMode=full-width` as a feed layout instruction, while `visible=false` removes the detail record from every list.
- Keep the legacy Media Center untouched; v2 lives on independent routes until acceptance.

## Risks / Trade-offs

- Query-index data appears only after the detail page is published to EDS Preview. The block therefore shows a neutral publication state rather than falling back to stale hand-authored cards.
