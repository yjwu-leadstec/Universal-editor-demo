# Change: Switch Media Center v2 to Content Fragment GraphQL

## Why

The Query Index only exposes page paths for the current v2 detail records; its custom Media Entry fields are not serialized into the list response. As a result, Photos and Videos cannot be reliably rendered from their published editorial data.

## What Changes

- Replace the media-center-feed runtime source with the published AEM Content Fragment GraphQL query.
- Use each fragment's jsonEntry record as the single source of truth for type, visibility, ordering, layout, image, detail page and media-specific metadata.
- Retain the independent /media-center-v2 routes and leave the legacy /media-center implementation unchanged.
- Document the persisted query, Content Fragment root, authoring fields and publication sequence.

## Impact

- Affected code: blocks/media-center-feed/ and generated component model JSON.
- Affected AEM configuration: the global GraphQL endpoint and persisted media-center-feed query must be published with the Content Fragments.
- Existing v2 list pages automatically receive the new source; no card-by-card authoring is introduced.
