## 1. Analysis and Model

- [x] 1.1 Confirm every `chapter-intro` code, model, test, documentation, and
      authored-content reference.
- [x] 1.2 Define the canonical
      `lixiang-product-full-screen-intro` model without field changes.

## 2. Implementation

- [x] 2.1 Rename the block directory and all three block files.
- [x] 2.2 Rename the Universal Editor definition/model ID and display name.
- [x] 2.3 Rename all block-specific JavaScript and CSS classes.
- [x] 2.4 Update aggregation, lint limits, tests, drafts, and documentation.
- [x] 2.5 Confirm the old namespace is absent from deployable code and generated
      JSON.

## 3. Validation and Delivery

- [x] 3.1 Run `npm run build:json`, lint, and the relevant test suite.
- [x] 3.2 Rebase onto and push remote `main`.
- [x] 3.3 Replace the six Li L6 authored instances with clean new-model nodes.
- [x] 3.4 Publish and verify Author plus Preview at all required widths with no
      block or console errors.
- [x] 3.5 Update this checklist and record final evidence.

## Final Evidence

- Remote implementation commit: `8f5e53fca49fb3018bd4aea29bb8e5628ddb763a`.
- AEM Author: six clean `lixiang-product-full-screen-intro` instances, zero
  `chapter-intro` instances, all six loaded at a bounded 16:9 authoring ratio.
- EDS Preview: verified at 1920, 1440, 1024, 768, and 390 px with six loaded
  instances, zero legacy instances, zero block errors, zero horizontal
  overflow, and zero console errors.
