# Product Table Block Implementation

## Overview
Created a dynamic Product Table block that fetches JSON data from AEM DAM and displays it in an interactive table format with search and filtering capabilities.

## Files Created
1. `/blocks/product-table/product-table.js` - Main JavaScript logic
2. `/blocks/product-table/product-table.css` - Styling for the table
3. `/blocks/product-table/_product-table.json` - Universal Editor configuration
4. `/dummy-data/rt5760_series.json` - Sample data file
5. `/test-product-table.html` - Test page
6. `/PRODUCT_TABLE_USAGE.md` - Usage documentation

## Key Features
- Dynamic JSON data loading from DAM
- Real-time search functionality
- Feature-based filtering with dropdown
- Responsive table with sticky header
- Sticky first column for product comparison
- Dark mode support
- Loading and error states

## Data Flow
1. Block reads configuration from DOM (title, source path)
2. Fetches JSON data using fetch API
3. Parses and validates data
4. Creates table structure dynamically
5. Implements client-side filtering
6. Updates DOM with results

## JSON Data Structure
```json
{
  "source": "description",
  "units": { "field": "unit" },
  "products": [
    {
      "product_number": "RT5760A",
      "status": "Active",
      "product_differences": ["feature1", "feature2"],
      // other specifications
    }
  ]
}
```

## Path Mapping
- AEM: `/content/dam/demo-site/dummy-data/file.json`
- Web: `/dummy-data/file.json`
- Configured in `paths.json`

## Usage in Content
```html
<div class="product-table">
  <div>
    <div>Title</div>
    <div>Product Comparison</div>
  </div>
  <div>
    <div>Source</div>
    <div>/dummy-data/rt5760_series.json</div>
  </div>
</div>
```

## Testing
- Local server: `aem up`
- Test URL: `http://localhost:3000/test-product-table.html`
- Verify data loading, search, and filtering