import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  // The block structure from Universal Editor will have rows for each field
  const rows = [...block.children];

  // Create the avatar container
  const avatarContainer = document.createElement('div');
  avatarContainer.className = 'avatar-container';

  // Initialize variables for each field
  let imageRow = null;
  let nameRow = null;
  let titleRow = null;
  let sizeValue = 'medium'; // Default size

  // Process rows based on content
  // The Universal Editor may include additional rows for metadata
  rows.forEach((row) => {
    const text = row.textContent.trim().toLowerCase();

    // Debug: Log each row to understand the structure
    // console.log(`Row: "${row.textContent.trim()}"`, row);

    // First row with picture is the image
    if (!imageRow && row.querySelector('picture')) {
      imageRow = row;
    } else if (text === 'small' || text === 'medium' || text === 'large') {
      // Check if this row contains size data
      sizeValue = text;
      // console.log(`Found size value: ${sizeValue}`);
    } else if (row.textContent.trim() && text !== 'small' && text !== 'medium' && text !== 'large') {
      // Other rows with text content (not size) are name and title
      if (!nameRow) {
        nameRow = row;
      } else if (!titleRow) {
        titleRow = row;
      }
    }
  });

  // Create the image wrapper
  if (imageRow) {
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'avatar-image-wrapper';

    // Move existing image element (preserves instrumentation)
    const picture = imageRow.querySelector('picture');
    if (picture) {
      moveInstrumentation(imageRow, imageWrapper);
      imageWrapper.appendChild(picture);
      avatarContainer.appendChild(imageWrapper);
    }
  }

  // Create info section
  const infoSection = document.createElement('div');
  infoSection.className = 'avatar-info';

  // Add name
  if (nameRow && nameRow.textContent.trim()) {
    const nameElement = document.createElement('h3');
    nameElement.className = 'avatar-name';
    moveInstrumentation(nameRow, nameElement);
    nameElement.textContent = nameRow.textContent.trim();
    infoSection.appendChild(nameElement);
  }

  // Add title
  if (titleRow && titleRow.textContent.trim()) {
    const titleElement = document.createElement('p');
    titleElement.className = 'avatar-title';
    moveInstrumentation(titleRow, titleElement);
    titleElement.textContent = titleRow.textContent.trim();
    infoSection.appendChild(titleElement);
  }

  // Only append info section if it has content
  if (infoSection.children.length > 0) {
    avatarContainer.appendChild(infoSection);
  }

  // Apply size class based on the size value from data or block class
  let sizeClass = 'size-medium';

  // First check block classes (for backward compatibility)
  if (block.classList.contains('small')) {
    sizeClass = 'size-small';
  } else if (block.classList.contains('large')) {
    sizeClass = 'size-large';
  } else if (block.classList.contains('medium')) {
    sizeClass = 'size-medium';
  } else if (sizeValue === 'small') {
    // Then check the size value from data (takes precedence)
    sizeClass = 'size-small';
  } else if (sizeValue === 'large') {
    sizeClass = 'size-large';
  } else if (sizeValue === 'medium') {
    sizeClass = 'size-medium';
  }

  avatarContainer.classList.add(sizeClass);

  // Clear the block and append the new structure
  block.textContent = '';
  block.appendChild(avatarContainer);
}
