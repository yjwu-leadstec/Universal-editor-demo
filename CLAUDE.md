# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AEM Edge Delivery Services project configured for the Universal Editor, providing visual editing capabilities for Franklin blocks. It uses JavaScript/TypeScript with component-based architecture for creating editable content blocks.

## Development Commands

### Build & Validation
```bash
# Run all linters
npm run lint

# Run JavaScript linting only
npm run lint:js

# Run CSS linting only
npm run lint:css

# Fix linting issues automatically
npm run lint:fix

# Build component JSON models (merges _component-*.json from models/)
npm run build:json
```

### Local Development
```bash
# Start local development server (requires @adobe/aem-cli)
aem up
# Opens browser at http://localhost:3000

# Install AEM CLI if not already installed
npm install -g @adobe/aem-cli
```

## Project Architecture

### Core Structure
- **Franklin blocks system**: Components in `/blocks/*` with each block containing `.js`, `.css`, and optional `_*.json` files
- **Universal Editor integration**: Component definitions, models, and filters in root JSON files
- **Instrumentation pattern**: Uses `moveInstrumentation()` to enable Universal Editor authoring

### Key Files & Patterns

#### Block Development Pattern
Each block follows this structure:
```
/blocks/[block-name]/
  ├── [block-name].js   # Main decorate() function
  ├── [block-name].css  # Block styles
  └── _[block-name].json # Universal Editor model (if editable)
```

The `decorate()` function pattern:
- Receives block element with rows of data from Universal Editor
- Transforms content into desired HTML structure
- Preserves Universal Editor instrumentation via `moveInstrumentation()`

#### Component Model System
1. **Source models** in `/models/_*.json` define base models and UI components
2. **Build process** merges models into:
   - `component-models.json`: Field definitions for Universal Editor
   - `component-definition.json`: Component UI configuration
   - `component-filters.json`: Component placement rules

#### Script Loading Phases
- **Eager**: Core functionality (`loadEager`)
- **Lazy**: Below-the-fold content (`loadLazy`)
- **Delayed**: Analytics and non-critical features (`loadDelayed`)

### Universal Editor Integration
- **Instrumentation**: Data attributes for editable regions are moved from source to decorated elements
- **Editor support**: `scripts/editor-support.js` handles real-time updates
- **RTE support**: `scripts/editor-support-rte.js` enables rich text editing

### Core Utilities (scripts/aem.js)
- `loadBlock()`: Dynamically loads and decorates blocks
- `decorateBlock()`: Applies block decoration pattern
- `buildBlock()`: Creates block elements programmatically
- `decorateSections()`: Processes page sections
- `decorateButtons()`: Standardizes button styling

## Development Guidelines

### Adding New Blocks
1. Create `/blocks/[name]/` directory
2. Implement `[name].js` with `export default function decorate(block)`
3. Add `[name].css` for styling
4. For Universal Editor support, create `_[name].json` model
5. Register in component models if needed

### CSS Classes Pattern
- Container: `.block-name-container`
- Elements: `.block-name-element`
- Variants: `.block-name-variant`

### Universal Editor Models
When creating editable components:
1. Define field models in `/blocks/[name]/_[name].json`
2. Ensure unique IDs across all models
3. Use appropriate field types from base models (_text.json, _image.json, etc.)
4. Models are auto-merged during build via `npm run build:json`

## Environment URLs
- Preview: `https://main--{repo}--{owner}.aem.page/`
- Live: `https://main--{repo}--{owner}.aem.live/`

## Prerequisites
- Node.js 18.3.x or newer
- AEM Cloud Service release 2024.8 or newer (>= 17465)
- AEM Code Sync GitHub App installed on repository