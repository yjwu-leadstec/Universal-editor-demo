## 1. Analysis and Contract

- [x] 1.1 Verify the latest supplied document and current ontest store response.
- [x] 1.2 Define acceptance criteria, safe activation, content-model boundary,
      request fields, headers, mappings, and external blockers.

## 2. Implementation

- [x] 2.1 Add the pure Test Drive API client, identifiers, mappings, and typed
      result errors.
- [x] 2.2 Integrate explicit `ontest` mode into the existing submit flow while
      preserving custom-event and same-origin behavior.
- [x] 2.3 Add the safe read-first smoke utility and calling-chain documentation.

## 3. Validation and Delivery

- [x] 3.1 Add mock contract coverage for store query, lead add, challenge, and
      captcha retry.
- [x] 3.2 Run `npm run build:json`, lint, and the complete test suite.
- [x] 3.3 Verify the local page at mobile, tablet, and desktop with no write
      request in default mode.
- [x] 3.4 Run the read-only ontest store smoke check.
- [ ] 3.5 Rebase onto and push remote `main`, then verify the remote preview.
- [ ] 3.6 Record final evidence and remaining external prerequisites.
