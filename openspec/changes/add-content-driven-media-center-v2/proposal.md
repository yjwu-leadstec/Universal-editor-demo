# Change: Add a content-driven Media Center v2

## Why

The existing Media Center implementation stores cards directly on each list page. That duplicates editorial data and cannot express a hidden record or a full-width record without page-specific handwork.

## What Changes

- Add an independent `media-center-feed` block for a new `/media-center-v2` route family; it does not alter the existing Media Center page or blocks.
- Read media detail-record metadata below a configured `/media-library` path from the EDS query index.
- Filter records by media type and visibility, sort them consistently, and render each record as grid or full-width according to its metadata.

## Impact

- Affected code: `blocks/media-center-feed/` and generated component JSON.
- Affected content: new v2 list and detail routes only.
- No existing page is replaced or removed.
