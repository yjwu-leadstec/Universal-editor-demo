# Change: Rebuild Media Center from the live site

## Why

The existing `/language-master/en/media-center` implementation follows an outdated design prototype: a featured card, same-page tabs, and modal details. The live Li Auto Media Center is a different experience: separate Newsroom, Photos, and Videos routes with a uniform responsive card grid. The EDS page therefore cannot be visually or behaviorally aligned through incremental styling fixes.

## What Changes

- Add page-specific `live-media-header` and `live-media-grid` EDS blocks instead of reusing the existing design-prototype media blocks.
- Model a reusable live-media card collection that supports Newsroom, Photos, and Videos metadata plus an authored destination URL.
- Render the live page pattern: title, route tabs, responsive two-column/single-column card grid, card image, title, and type metadata.
- Preserve Universal Editor instrumentation for every authored property and collection item.
- Migrate the currently visible live content into Author-managed page data: 7 Newsroom items, 6 Photos albums, and the current Videos items.
- Retire the old `media-tabs`, `media-featured-card`, and `media-card-grid` blocks only from the Media Center routes after their replacement is live; leave their implementation available for existing unrelated content until separately removed.

## Impact

- Affected code: new `blocks/live-media-header/`, `blocks/live-media-grid/`, and generated component JSON.
- Affected content: `/content/demo-site/language-master/en/media-center` plus new Photos and Videos route pages, or equivalent approved page paths.
- Affected specs: new `live-media-center` capability.
- No runtime dependency on the public liauto.com feed: content remains authored in AEM so it is reviewable, publishable, and stable.
