## Context

Media Center v2 needs an editorial source that can express a hidden entry, ordering and a desktop full-width card without duplicating list-page cards. The existing Content Fragments under /content/dam/li-auto/media-center-v2 already contain that record in the Simple JSON Object model's jsonEntry field.

## Decisions

- Fetch the published persisted query at /graphql/execute.json/global/media-center-feed.
- The query returns only simpleJsonObjectList records below /content/dam/li-auto/media-center-v2/.
- Parse the GraphQL JSON Object field in the block, then apply the existing visible/type/sort/layout rules client-side.
- Prefer detailPath for the card link and retain _path only for Content Fragment root filtering.
- Keep the block's sourcePath configuration as the Content Fragment root. Older page values that are not DAM paths safely fall back to the standard v2 root.

## Risks and mitigations

- The persisted query and its GraphQL endpoint are separate publishable AEM resources. The authoring manual requires publishing both before validating EDS Preview.
- The public GraphQL response is cross-origin from EDS Preview. Runtime verification must confirm that the publish endpoint accepts the EDS origin.
