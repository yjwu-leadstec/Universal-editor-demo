# Change: Add Test Drive API Adapter

## Why

The `lixiang-test-drive-booking` block currently validates the form and emits
`testdrive:submit`, but its built-in fallback only accepts an unspecified
same-origin JSON endpoint. It does not implement the Li Auto overseas lead
contract, store lookup, response codes, trace headers, or captcha retry path.

The supplied ontest API is a write-capable external service. The EDS preview
origin is not currently allowed by its CORS policy, and several production
business values are still unconfirmed. The integration therefore needs a
tested adapter while remaining impossible to activate accidentally.

## What Changes

- Add a pure Test Drive API module for:
  - read-only store lookup;
  - lead payload and header construction;
  - `/leads/add` and `/leads/add-with-captcha`;
  - success code `0`, challenge code `600003`, HTTP, and API error handling.
- Add the documented model/store mappings and reject unmapped values instead of
  guessing.
- Integrate the adapter behind an explicit runtime `ontest` mode. With no mode,
  the existing page remains write-disabled.
- Preserve the cancelable `testdrive:submit` extension event and the existing
  same-origin endpoint path.
- Add mock contract tests and a smoke utility whose default operation is the
  read-only KZ store query. Write calls require both `--allow-write` and complete
  test-only environment values.
- Document the exact call chain and the remaining external prerequisites.

## Impact

- Affected spec: `test-drive-api`
- Affected code:
  `blocks/lixiang-test-drive-booking/`, `test/`, `scripts/`, and test-drive API
  integration documentation.
- Affected page:
  `/language-master/en/test-drive`
- No Universal Editor model or authored content migration is required.
