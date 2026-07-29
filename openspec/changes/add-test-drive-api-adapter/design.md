## Context

The existing block owns presentation, validation, model/store selection, and
success/error UI. The external service owns store codes, lead creation, and
challenge enforcement. These responsibilities should remain separate so the
API contract can be verified without a browser or AEM content.

The current document and observed ontest service establish:

- base URL `https://bcs-api-web-ontest-b.liauto.com`;
- store query `GET /saos-global-leads-api/leads/query-store-list`;
- lead write `POST /saos-global-leads-api/leads/add`;
- captcha retry `POST /saos-global-leads-api/leads/add-with-captcha`;
- API success `code: 0` and challenge `code: 600003`;
- request headers `x-chj-metadata`, `x-chj-sourceurl`, and `x-chj-traceid`;
- model codes L9=`L9`, L8=`X02`, L7=`X03`, L6=`X04`;
- three current KZ store codes returned by the read-only service.

## Goals / Non-Goals

- Goals:
  - Encode the documented API contract in a small testable module.
  - Keep PII ephemeral and never log request bodies.
  - Require explicit activation and complete business configuration before a
    write request can be created.
  - Preserve the current component UI and Universal Editor instrumentation.
  - Provide a safe way to verify the read and write call chain.
- Non-Goals:
  - Enable live lead creation on the public EDS page.
  - Invent an English KZ language value, Shymkent store code, agreement
    version, or captcha token acquisition flow.
  - Add a CORS proxy or change the external API allowlist.
  - Store customer form values in localStorage, sessionStorage, cookies, logs,
    or analytics.
  - Change the visual design or authored content model.

## Acceptance Criteria

### Functional Requirements

- The client queries the current KZ store list and normalizes the three returned
  store entries.
- Form values map to the documented lead payload only when every required
  business value and model/store mapping is available.
- The first write uses `/leads/add`; a supplied challenge token uses
  `/leads/add-with-captcha` and the `Challenge-Authorization` header.
- API code `0` resolves successfully, `600003` becomes a typed challenge
  result, and all other HTTP/API failures remain visible to the caller without
  leaking PII.
- The block uses the API client only when its runtime API mode is exactly
  `ontest`.
- Without explicit mode/configuration, the deployed page performs no Li Auto
  lead API write.

### Edge Cases

- Unknown model keys, unknown store keys, and the currently unmapped Shymkent
  store fail before network submission.
- Missing `leadSource`, `leadsLanguage`, `agreementVersion`, or source URL fails
  before network submission.
- An allowlisted `chjchannelcode` may supply `leadSource`; unknown values are
  rejected.
- Empty optional phone remains an empty string while `phoneCountryCode`
  remains explicit.
- Malformed JSON and non-2xx responses become sanitized API errors.

### Responsive Behavior

- Mobile, tablet, and desktop layouts remain unchanged.
- Existing chooser, validation, loading, toast, and success states remain
  usable at all supported breakpoints.

### Author Experience

- Authors continue to manage copy, four model entries, PC/Pad media, and store
  display entries through the existing models.
- Authors cannot configure environment URLs, API modes, credentials, or
  business attribution values in Universal Editor.

### Definition of Done

- Contract tests cover read, add, challenge, captcha retry, mapping, and safe
  failure behavior.
- `build:json`, lint, and the repository test suite pass.
- Browser QA confirms the existing page has no visual regression and produces
  no Li Auto write request while API mode is absent.
- The read-only smoke call succeeds against the current ontest host.

## Content Model

The authored model is intentionally unchanged:

- parent `lixiang-test-drive-booking`: copy, consent link, submit copy, and
  success copy;
- child `test-drive-model`: stable key, display copy, PC image, Pad image, and
  alt text;
- child `test-drive-store`: stable key, city, display name, and allowed model
  keys.

API environment and attribution are runtime integration settings, not authored
content. This keeps the collection model predictable and prevents an authoring
action from enabling external writes.

## Runtime Contract

The block accepts explicit runtime data attributes for `apiMode`, `baseUrl`,
`leadSource`, `leadsLanguage`, `countryCode`, `agreementId`,
`agreementVersion`, and `phoneCountryCode`. Only `apiMode=ontest` selects the
external adapter. The module also accepts injected `fetch`, source URL, trace
ID, and device ID values for deterministic tests.

The existing cancelable `testdrive:submit` event remains the first extension
point. Preventing that event continues to transfer submission ownership to the
integrator.

## Call Chain

1. Validate the authored form locally.
2. Emit the cancelable `testdrive:submit` event.
3. Resolve explicit runtime settings and documented model/store mappings.
4. Build a fresh device ID, trace ID, metadata header, and lead payload.
5. POST `/leads/add`.
6. On code `0`, show the existing success state.
7. On code `600003`, emit a challenge-required signal and keep the form
   recoverable.
8. Once an external captcha integration supplies a token, call
   `/leads/add-with-captcha` with `Challenge-Authorization: Bearer <token>`.

## Risks / Trade-offs

- Direct browser writes from the EDS preview host remain blocked until Li Auto
  adds the origin to CORS or an approved same-origin proxy is supplied.
- English is not in the current KZ language list, so the English page must stay
  disabled until the business confirms the value.
- The current store query has no Shymkent record. Rejecting that selection is
  safer than sending the wrong dealer code.
- Captcha token acquisition remains an external integration boundary; the
  adapter implements the retry request but does not embed an unapproved SDK.

## Rollback

Revert the adapter, its block import/branch, tests, smoke utility, and
documentation. Authored content requires no rollback because its model is
unchanged and the default page never enables the external mode.
