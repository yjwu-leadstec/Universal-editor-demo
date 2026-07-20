# Change: Add governed DAM structure and migrate Homepage assets

## Why

The current Homepage references assets scattered below `/content/dam/li-demo` using component-oriented folders and several opaque filenames. This does not provide a stable governance boundary for the Global and Central Asia site families and the current assets do not consistently match the active `lixiang2/eds-reference` content source.

## What Changes

- Create `/content/dam/li-auto` as the governed DAM root in `leadstec-dev`.
- Add shared, Global-managed, Central-Asia-managed, intake, and archive folder boundaries.
- Migrate only the 41 unique assets consumed by the current Homepage model from `lixiang2/eds-reference/assets/data/site-data.js`.
- Store language-neutral vehicle, brand, and technology media under `shared` instead of duplicating binaries by market.
- Update `/content/demo-site/language-master/en/homepage` component properties to the new DAM paths.
- Add the `/content/dam/li-auto/` to `/assets/` EDS path mapping and use an asset reference field for Homepage videos.
- Preserve `/content/dam/li-demo` unchanged as the rollback source during validation.
- Keep Dynamic Media, per-user ACLs, automated translation, and non-Homepage page migrations out of scope.

## Impact

- Affected capability: DAM governance and Homepage asset resolution.
- Affected AEM content: `/content/dam/li-auto` and `/content/demo-site/language-master/en/homepage`.
- Affected code/configuration: `paths.json`, the generated Universal Editor models, and the `home-carousel` video field definition.
- Source of truth: `lixiang2/eds-reference/assets/data/site-data.js` `home.blocks`.

## Approval

Implementation was explicitly requested by the user on 2026-07-20 after review of the proposed DAM architecture.
