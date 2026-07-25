## ADDED Requirements

### Requirement: Live-aligned Media Center list pages

The system SHALL provide author-editable Newsroom, Photos, and Videos list pages whose layout and responsive behavior follow the current live Li Auto Media Center rather than the prior design-prototype layout.

#### Scenario: Desktop Newsroom layout

- **WHEN** a visitor opens the Newsroom route at a 1920px viewport
- **THEN** the page renders the `Newsroom` heading, route tabs, and a 1480px two-column card grid with 24px gaps
- **AND** each card renders a cover image, title, and publication date in the live page hierarchy.

#### Scenario: Mobile list layout

- **WHEN** a visitor opens any Media Center list route at a 390px viewport
- **THEN** the page renders one 350px card column with 20px page gutters
- **AND** the document has no horizontal overflow.

### Requirement: Author-editable media card collection

The system SHALL expose card title, date, cover image, destination, image alt text, photo count, and video duration through Universal Editor models.

#### Scenario: Photo metadata

- **WHEN** an author adds a Photos card with a quantity value
- **THEN** the rendered card displays the quantity alongside its date
- **AND** the card retains the author-supplied destination URL.

#### Scenario: Video metadata

- **WHEN** an author adds a Videos card with a duration value
- **THEN** the rendered card displays the duration alongside its date
- **AND** the card retains the author-supplied destination URL.

### Requirement: Route tab navigation

The system SHALL render Newsroom, Photos, and Videos as route links, with the current route visibly active and keyboard accessible.

#### Scenario: Navigate to Photos

- **WHEN** a visitor activates the Photos tab by mouse or keyboard
- **THEN** the browser follows the authored Photos route
- **AND** the Photos tab is rendered as active on that route.
