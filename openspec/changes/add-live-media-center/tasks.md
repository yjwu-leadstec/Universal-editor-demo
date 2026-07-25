## 1. Analysis and content preparation

- [ ] 1.1 Confirm approved EDS route paths for Newsroom, Photos, and Videos.
- [x] 1.2 Capture and validate the current live catalogue and destination routes.
- [ ] 1.3 Create the corresponding AEM Author content and DAM references.

## 2. Implementation

- [x] 2.1 Add `live-media-header` block and its Universal Editor model.
- [x] 2.2 Add `live-media-grid` and `live-media-card` collection model.
- [x] 2.3 Implement responsive live-site card layout, active tab navigation, hover, and keyboard focus states.
- [x] 2.4 Preserve `data-aue-*` instrumentation for all authored content.

## 3. Validation and rollout

- [x] 3.1 Run `npm run build:json`, `npm run lint`, and `git diff --check`.
- [ ] 3.2 Compare Newsroom, Photos, and Videos at 1920, 1440, 1024, 768, and 390px.
- [ ] 3.3 Verify Author canvas at about 1006px and EDS Preview after content migration.
- [ ] 3.4 Publish the approved content and validate the production route links.
