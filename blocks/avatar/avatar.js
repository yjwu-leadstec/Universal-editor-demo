import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  // The block structure from Universal Editor will have rows for each field
  const rows = [...block.children];

  // Create the avatar container
  const avatarContainer = document.createElement('div');
  avatarContainer.className = 'avatar-container';

  // Extract data from rows (following the model field order)
  // Row 0: image, Row 1: name, Row 2: title
  const imageRow = rows[0];
  const nameRow = rows[1];
  const titleRow = rows[2];

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

  // Apply size class based on the size variant
  let sizeClass = 'size-medium';
  if (block.classList.contains('small')) {
    sizeClass = 'size-small';
  } else if (block.classList.contains('large')) {
    sizeClass = 'size-large';
  }
  avatarContainer.classList.add(sizeClass);

  // Clear the block and append the new structure
  block.textContent = '';
  block.appendChild(avatarContainer);
}
