# Avatar Block Size Fix

## Issue
The avatar block size settings (small/medium/large) were not working in the Universal Editor. Only one size was displayed regardless of the selection.

## Root Cause
The JavaScript code was incorrectly checking for CSS classes on the block element instead of reading the size value from the Universal Editor data fields.

### Original Implementation Issue:
- The code checked: `block.classList.contains('small')`
- But Universal Editor passes size as a data field in rows, not as a CSS class

## Solution
Updated `blocks/avatar/avatar.js` to:
1. Process rows dynamically to find the size value
2. Check for size value in row content ('small', 'medium', 'large')
3. Apply appropriate CSS class to avatar container
4. Maintain backward compatibility by checking block classes first

## Component Model Configuration
In `component-models.json`, the avatar has these fields:
1. image (reference)
2. imageAlt (text)
3. personName (text)
4. title (text)
5. size (select: small/medium/large)

## CSS Classes
The styles are properly defined in `blocks/avatar/avatar.css`:
- `.avatar-container.size-small`: 64px avatar
- `.avatar-container.size-medium`: 128px avatar (default)
- `.avatar-container.size-large`: 256px avatar

## Testing Notes
To verify the fix:
1. Open page in Universal Editor
2. Add/edit an avatar block
3. Change the size dropdown
4. Save and preview - size should now reflect selection
5. Debug logs can be enabled by uncommenting console.log statements