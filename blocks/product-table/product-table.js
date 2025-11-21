import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Loads and decorates the product table block
 * @param {Element} block The product table block element
 */
export default async function decorate(block) {
  // Read block configuration (if any)
  const config = readBlockConfig(block);
  const jsonPath = config.source || '/dummy-data/rt5760_series.json';

  try {
    // Create container for loading state
    const container = document.createElement('div');
    container.className = 'product-table-container';

    // Show loading state
    container.innerHTML = '<p class="loading">Loading product data...</p>';
    block.textContent = '';
    block.appendChild(container);

    // Fetch JSON data
    const response = await fetch(jsonPath);

    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.status}`);
    }

    const data = await response.json();

    // Create table
    const table = createProductTable(data);

    // Create filters section
    const filters = createFilters(data, table);

    // Clear loading state and add content
    container.innerHTML = '';

    // Add title if available
    if (config.title) {
      const title = document.createElement('h2');
      title.className = 'product-table-title';
      title.textContent = config.title;
      container.appendChild(title);
    }

    // Add data source info
    if (data.source) {
      const sourceInfo = document.createElement('p');
      sourceInfo.className = 'source-info';
      sourceInfo.textContent = `Source: ${data.source}`;
      container.appendChild(sourceInfo);
    }

    // Add filters
    container.appendChild(filters);

    // Add table
    container.appendChild(table);

    // Preserve Universal Editor instrumentation
    moveInstrumentation(block, container);

  } catch (error) {
    console.error('Product table error:', error);
    block.innerHTML = `
      <div class="error-message">
        <p>Error loading product data</p>
        <p class="error-details">${error.message}</p>
      </div>
    `;
  }
}

/**
 * Creates the product comparison table
 * @param {Object} data The product data
 * @returns {HTMLTableElement} The created table element
 */
function createProductTable(data) {
  const table = document.createElement('table');
  table.className = 'product-table';

  // Create table header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  // Define columns to display
  const columns = [
    { key: 'product_number', label: 'Product', sticky: true },
    { key: 'status', label: 'Status' },
    { key: 'product_differences', label: 'Key Features' },
    { key: 'iq_typ_mA', label: 'IQ (mA)' },
    { key: 'vin_range', label: 'VIN Range (V)' },
    { key: 'vout_range', label: 'VOUT Range (V)' },
    { key: 'iout_max_a', label: 'Max Current (A)' },
    { key: 'freq_typ_khz', label: 'Frequency (kHz)' },
    { key: 'ron_hs_typ_mohm', label: 'RON HS (mΩ)' },
    { key: 'ron_ls_typ_mohm', label: 'RON LS (mΩ)' },
  ];

  // Create header cells
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col.label;
    if (col.sticky) {
      th.className = 'sticky-column';
    }
    th.setAttribute('data-column', col.key);
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create table body
  const tbody = document.createElement('tbody');

  data.products.forEach(product => {
    const row = document.createElement('tr');
    row.setAttribute('data-product', product.product_number);

    columns.forEach(col => {
      const td = document.createElement('td');

      if (col.sticky) {
        td.className = 'sticky-column';
      }

      // Handle special formatting for certain columns
      switch (col.key) {
        case 'product_differences':
          // Display as comma-separated list
          td.textContent = product[col.key] ? product[col.key].join(', ') : '-';
          break;
        case 'vin_range':
          // Combine min and max voltage
          td.textContent = `${product.vin_min_v} - ${product.vin_max_v}`;
          break;
        case 'vout_range':
          // Combine min and max voltage
          td.textContent = `${product.vout_min_v} - ${product.vout_max_v}`;
          break;
        case 'status':
          // Add status class for styling
          td.textContent = product[col.key] || '-';
          td.className = `${td.className} status-${product[col.key]?.toLowerCase()}`;
          break;
        default:
          // Default formatting
          const value = product[col.key];
          td.textContent = value !== undefined && value !== null ? value : '-';
      }

      row.appendChild(td);
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);

  // Add table wrapper for horizontal scrolling
  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'table-wrapper';
  tableWrapper.appendChild(table);

  return tableWrapper;
}

/**
 * Creates filter controls for the table
 * @param {Object} data The product data
 * @param {HTMLElement} tableWrapper The table wrapper element
 * @returns {HTMLElement} The filters container
 */
function createFilters(data, tableWrapper) {
  const filtersContainer = document.createElement('div');
  filtersContainer.className = 'filters-container';

  // Search box
  const searchWrapper = document.createElement('div');
  searchWrapper.className = 'search-wrapper';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search products (e.g., RT5760A, PSM, PWM)...';
  searchInput.className = 'search-input';

  // Filter by features
  const featureSelect = document.createElement('select');
  featureSelect.className = 'feature-select';

  // Collect unique features
  const uniqueFeatures = new Set();
  data.products.forEach(product => {
    if (product.product_differences) {
      product.product_differences.forEach(feature => uniqueFeatures.add(feature));
    }
  });

  // Add options to select
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'All Features';
  featureSelect.appendChild(defaultOption);

  Array.from(uniqueFeatures).sort().forEach(feature => {
    const option = document.createElement('option');
    option.value = feature;
    option.textContent = feature;
    featureSelect.appendChild(option);
  });

  // Clear filters button
  const clearButton = document.createElement('button');
  clearButton.className = 'clear-filters';
  clearButton.textContent = 'Clear Filters';
  clearButton.style.display = 'none';

  // Filter function
  const filterTable = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedFeature = featureSelect.value;
    const table = tableWrapper.querySelector('table');
    const rows = table.querySelectorAll('tbody tr');

    let visibleCount = 0;

    rows.forEach(row => {
      const productNumber = row.getAttribute('data-product').toLowerCase();
      const featureCell = row.cells[2].textContent.toLowerCase(); // Features column

      let shouldShow = true;

      // Apply search filter
      if (searchTerm) {
        // Search in product number and features
        shouldShow = productNumber.includes(searchTerm) ||
                    featureCell.includes(searchTerm);
      }

      // Apply feature filter
      if (shouldShow && selectedFeature) {
        shouldShow = featureCell.includes(selectedFeature.toLowerCase());
      }

      row.style.display = shouldShow ? '' : 'none';
      if (shouldShow) visibleCount++;
    });

    // Show/hide clear button
    clearButton.style.display = (searchTerm || selectedFeature) ? 'inline-block' : 'none';

    // Update results count
    updateResultsCount(visibleCount, data.products.length);
  };

  // Update results count
  const resultsCount = document.createElement('span');
  resultsCount.className = 'results-count';

  const updateResultsCount = (visible, total) => {
    if (visible === total) {
      resultsCount.textContent = `Showing all ${total} products`;
    } else {
      resultsCount.textContent = `Showing ${visible} of ${total} products`;
    }
  };

  // Initial count
  updateResultsCount(data.products.length, data.products.length);

  // Event listeners
  searchInput.addEventListener('input', filterTable);
  featureSelect.addEventListener('change', filterTable);

  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    featureSelect.value = '';
    filterTable();
  });

  // Assemble filters
  searchWrapper.appendChild(searchInput);
  searchWrapper.appendChild(featureSelect);
  searchWrapper.appendChild(clearButton);

  filtersContainer.appendChild(searchWrapper);
  filtersContainer.appendChild(resultsCount);

  return filtersContainer;
}

/**
 * Reads configuration from block content
 * @param {Element} block The block element
 * @returns {Object} Configuration object
 */
function readBlockConfig(block) {
  const config = {};

  block.querySelectorAll(':scope > div').forEach((row) => {
    const cols = [...row.children];
    if (cols[1]) {
      const key = cols[0].textContent.trim().toLowerCase().replace(/\s+/g, '_');
      const value = cols[1].textContent.trim();
      config[key] = value;
    }
  });

  return config;
}