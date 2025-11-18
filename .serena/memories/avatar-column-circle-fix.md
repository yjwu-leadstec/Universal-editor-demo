# Avatar Column Circle Display Fix

## Problem
Avatar images were not displaying as circles when placed inside column layouts. The circular shape was lost.

## Root Cause
The `columns.css` file contains a rule:
```css
.columns img {
  width: 100%;
}
```
This rule affects all images inside columns, including avatar images, overriding the fixed dimensions needed for circular display.

## Solution
Added specific CSS overrides at the end of `avatar.css`:

### 1. Maintain Fixed Dimensions
```css
.columns .avatar-image-wrapper {
  flex-shrink: 0;
  width: auto;
  height: auto;
}
```

### 2. Image Fill Override
```css
.columns .avatar-image-wrapper img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}
```

### 3. Size-Specific Overrides
```css
.columns .avatar-container.size-small .avatar-image-wrapper {
  width: 64px !important;
  height: 64px !important;
}
/* Similar for medium and large sizes */
```

## CSS Organization
- All columns-specific rules placed at the end of the file for proper specificity
- Used `stylelint-disable no-descending-specificity` for intentional overrides
- Maintained separation between base styles and columns-specific fixes

## Result
Avatar images now maintain their circular shape both when used standalone and when placed inside column layouts.