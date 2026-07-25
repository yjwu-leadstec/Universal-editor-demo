## 1. Runtime implementation

- [x] 1.1 Replace the Query Index request with the persisted Content Fragment GraphQL request.
- [x] 1.2 Normalize the jsonEntry payload and keep existing list filtering, ordering, full-width and marker behavior.
- [x] 1.3 Rename the block source field to Content Fragment Root and rebuild generated component JSON.

## 2. AEM content delivery

- [x] 2.1 Enable persisted GraphQL queries for the global configuration.
- [x] 2.2 Create and publish the scoped media-center-feed persisted query.
- [x] 2.3 Publish the GraphQL endpoint used by the persisted query.

## 3. Validation

- [ ] 3.1 Verify the published query returns the test CFs from the public endpoint.
- [ ] 3.2 Push main, wait for GitHub Build, and verify Newsroom, Photos and Videos in EDS Preview.
