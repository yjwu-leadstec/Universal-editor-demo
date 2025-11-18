# AEM Universal Editor Demo Project

## Project Purpose
This is an AEM Edge Delivery Services project configured for the Universal Editor, providing visual editing capabilities for Franklin blocks.

## Tech Stack
- AEM Edge Delivery Services (Franklin)
- Universal Editor
- JavaScript (ES6+)
- CSS3
- JSON configuration for components

## Project Structure
```
/blocks/          # Franklin block components
  /avatar/        # Avatar block with size variants
  /cards/         # Card components
  /header/        # Header block
  /footer/        # Footer block
  /hero/          # Hero banner block
/scripts/         # Core scripts and utilities
/styles/          # Global styles
/models/          # Component models
component-definition.json  # Universal Editor component definitions
component-models.json      # Field models for components
component-filters.json     # Component placement rules
```

## Key Components
1. **Avatar Block**: Circular profile image with name, title, and size variants
2. **Cards Block**: Card layout system
3. **Hero Block**: Hero banner with text overlay
4. **Columns Block**: Multi-column layout

## Development Patterns
- Blocks use `decorate()` function pattern
- Universal Editor instrumentation via `moveInstrumentation()`
- Data passed as rows from Universal Editor
- CSS classes for styling variants

## Code Conventions
- ES6 modules for JavaScript
- BEM-like CSS naming (e.g., `.avatar-container`, `.avatar-info`)
- Component-based architecture
- Progressive enhancement approach