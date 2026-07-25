## ADDED Requirements

### Requirement: Render Media Center v2 from published Content Fragments

The Media Center v2 feed MUST load its entries from the published AEM GraphQL persisted query rather than EDS Query Index page metadata.

#### Scenario: A published photo Content Fragment appears on the Photos route

- **WHEN** a published Content Fragment under the configured Content Fragment root has mediaType=photos and visible=true
- **THEN** the Photos route renders its cover, title, photo count, publish date and detailPath

#### Scenario: A hidden Content Fragment is excluded

- **WHEN** a Content Fragment has visible=false
- **THEN** it does not render on any Media Center v2 list route

### Requirement: Preserve responsive feed layout metadata

The Media Center v2 feed MUST apply featured, sortOrder and displayMode from each Content Fragment record.

#### Scenario: A full-width record is displayed

- **WHEN** a published Content Fragment has displayMode=full-width
- **THEN** its desktop card spans the two-column feed while the mobile layout remains a single card column
