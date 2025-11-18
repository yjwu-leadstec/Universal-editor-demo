# Avatar Component - Simplified Design

## Design Decision
Removed grid layout mode to keep the component simple and focused on single avatar display.

## Current Implementation

### CSS Structure
```css
/* Single avatar - always centered */
.block.avatar {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem 0;
}

/* Column compatibility */
.columns .block.avatar {
  width: 100%;
  margin: 0;
}
```

## Use Cases

### 1. Standalone Avatar
- Single avatar automatically centers
- Used for profile pages, about sections, team member highlights

### 2. Avatar in Columns
- Works seamlessly within column layouts
- Avatar stays centered within its column
- Used for side-by-side layouts with bio text

## Size Variants
- **Small**: 64px (compact displays)
- **Medium**: 128px (default)
- **Large**: 256px (featured profiles)

## Responsive Behavior
- Tablet (≤768px): Large avatars scale to 200px
- Mobile (≤480px): Large→150px, Medium→100px

## Why No Grid Mode?
- Multiple avatars should use dedicated grid components (like Cards)
- Keeps Avatar component focused and simple
- Reduces CSS complexity and maintenance
- Better separation of concerns

## Usage Guidelines
- Use Avatar for single person display
- For team grids, use Cards component with avatar styling
- Always include alt text for accessibility
- Size selection based on visual hierarchy needs