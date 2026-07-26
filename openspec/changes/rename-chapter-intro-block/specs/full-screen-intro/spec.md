## ADDED Requirements

### Requirement: Canonical Li Auto Full-Screen Intro Identity

The system SHALL expose the Li Auto product full-screen chapter opener only as
`lixiang-product-full-screen-intro`. The old `chapter-intro` block, model,
selectors, and loader path SHALL NOT remain available.

#### Scenario: Author inserts the component

- **WHEN** an author inserts the Li Auto product full-screen intro
- **THEN** Universal Editor creates a block with model
  `lixiang-product-full-screen-intro`
- **AND** the block loads JavaScript and CSS from the matching canonical folder

#### Scenario: Old component markup is encountered

- **WHEN** delivered content still uses the old `chapter-intro` identifier
- **THEN** the implementation provides no compatibility alias or legacy loader

### Requirement: Preserved Full-Screen Intro Presentation

The renamed component SHALL preserve the approved responsive media, copy,
video-control, and author instrumentation behavior of the existing component.

#### Scenario: Desktop presentation

- **WHEN** the component renders above 1024px
- **THEN** media fills a full-width 16:9 canvas
- **AND** the eyebrow and title render as left-aligned overlaid copy

#### Scenario: Mobile presentation

- **WHEN** the component renders at 719px or below
- **THEN** it uses the mobile media and title overrides when provided
- **AND** its height remains between 700px and 844px

#### Scenario: Universal Editor authoring

- **WHEN** the component renders in the Universal Editor canvas
- **THEN** authored fields remain selectable through preserved instrumentation
- **AND** the component height remains bounded at the 1006px authoring width
