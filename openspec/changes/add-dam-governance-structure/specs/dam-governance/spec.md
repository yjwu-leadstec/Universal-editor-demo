## ADDED Requirements

### Requirement: Governed DAM root

The system SHALL store newly governed website assets below `/content/dam/li-auto` with explicit shared, Global, Central Asia, intake, and archive boundaries.

#### Scenario: Governance folders are created

- **WHEN** the DAM structure is provisioned in an AEM environment
- **THEN** all required governance roots and market/language boundaries exist
- **AND** environment names are not embedded in asset paths

### Requirement: Canonical shared assets

The system SHALL store each language-neutral Homepage binary once under the appropriate shared brand, vehicle, or technology folder.

#### Scenario: Multiple pages use the same vehicle logo

- **WHEN** a vehicle logo is used by a tile and a hero slide
- **THEN** both component properties reference the same canonical DAM asset
- **AND** no market or page copy is created solely for reuse

### Requirement: EDS reference provenance

Every asset migrated in the Homepage batch MUST originate from a media URL used by `lixiang2/eds-reference/assets/data/site-data.js` `home.blocks` and consumed by the current Homepage content model.

#### Scenario: Unused reference asset exists

- **WHEN** `eds-reference` contains a media field that the current Homepage model cannot consume
- **THEN** that media is not uploaded in the Homepage migration batch

### Requirement: Reversible Homepage path migration

The system SHALL update Homepage asset references only after all target assets exist and SHALL preserve the old DAM tree and a recoverable page version during validation.

#### Scenario: Target upload fails

- **WHEN** any required target asset is missing or unreadable
- **THEN** Homepage references remain on the previous paths

#### Scenario: Validation fails after path switch

- **WHEN** Homepage rendering or Banner visibility fails after migration
- **THEN** the page can be restored to the captured version or old property map

### Requirement: Dynamic Media exclusion

The implementation MUST use standard AEM DAM references and MUST NOT store or require author-configured Dynamic Media URLs, Smart Crop, Scene7 URLs, or Dynamic Media profiles.

#### Scenario: Page asset is delivered

- **WHEN** EDS renders an uploaded Homepage image or video
- **THEN** the authored property contains a `/content/dam/li-auto/...` reference
- **AND** it does not contain a Dynamic Media delivery URL

### Requirement: EDS asset publication

The system SHALL map `/content/dam/li-auto/` into the public EDS asset namespace and include that DAM root in the site's publication scope.

#### Scenario: Homepage video is published

- **WHEN** a referenced MP4 is published with the Homepage
- **THEN** the semantic HTML links to the mapped `/assets/` path
- **AND** the path resolves to a same-origin HTTP 200 `video/mp4` response
