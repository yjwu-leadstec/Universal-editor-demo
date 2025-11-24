import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Gets API URL for product data
 * @param {string} configSource The configured source path
 * @returns {string} The API URL to use
 */
function getApiUrl(configSource) {
  // 如果配置了URL，使用配置的URL
  if (configSource && (configSource.startsWith('http://') || configSource.startsWith('https://'))) {
    return configSource;
  }

  // 默认使用AEM API端点
  return 'https://publish-p80707-e1685574.adobeaemcloud.com/services/products/comparison';
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
  columns.forEach((col) => {
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

  data.products.forEach((product) => {
    const row = document.createElement('tr');
    row.setAttribute('data-product', product.product_number);

    columns.forEach((col) => {
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
        case 'status': {
          // Add status class for styling
          td.textContent = product[col.key] || '-';
          const statusClass = product[col.key] ? `status-${product[col.key].toLowerCase()}` : '';
          td.className = statusClass ? `${td.className} ${statusClass}` : td.className;
          break;
        }
        default: {
          // Default formatting
          const value = product[col.key];
          td.textContent = value !== undefined && value !== null ? value : '-';
        }
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
  data.products.forEach((product) => {
    if (product.product_differences) {
      product.product_differences.forEach((feature) => uniqueFeatures.add(feature));
    }
  });

  // Add options to select
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'All Features';
  featureSelect.appendChild(defaultOption);

  Array.from(uniqueFeatures).sort().forEach((feature) => {
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

  // Results count element
  const resultsCount = document.createElement('span');
  resultsCount.className = 'results-count';

  // Update results count function
  const updateResultsCount = (visible, total) => {
    if (visible === total) {
      resultsCount.textContent = `Showing all ${total} products`;
    } else {
      resultsCount.textContent = `Showing ${visible} of ${total} products`;
    }
  };

  // Filter function
  const filterTable = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedFeature = featureSelect.value;
    const table = tableWrapper.querySelector('table');
    const rows = table.querySelectorAll('tbody tr');

    let visibleCount = 0;

    rows.forEach((row) => {
      const productNumber = row.getAttribute('data-product').toLowerCase();
      const featureCell = row.cells[2].textContent.toLowerCase(); // Features column

      let shouldShow = true;

      // Apply search filter
      if (searchTerm) {
        // Search in product number and features
        shouldShow = productNumber.includes(searchTerm)
          || featureCell.includes(searchTerm);
      }

      // Apply feature filter
      if (shouldShow && selectedFeature) {
        shouldShow = featureCell.includes(selectedFeature.toLowerCase());
      }

      row.style.display = shouldShow ? '' : 'none';
      if (shouldShow) visibleCount += 1;
    });

    // Show/hide clear button
    clearButton.style.display = searchTerm || selectedFeature ? 'inline-block' : 'none';

    // Update results count
    updateResultsCount(visibleCount, data.products.length);
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
 * Loads and decorates the product table block
 * @param {Element} block The product table block element
 */
export default async function decorate(block) {
  // Read block configuration (if any)
  const config = readBlockConfig(block);

  // Get API URL
  const apiUrl = getApiUrl(config.source);

  try {
    // Create container for loading state
    const container = document.createElement('div');
    container.className = 'product-table-container';

    // Show loading state
    container.innerHTML = '<p class="loading">Loading product data from API...</p>';
    block.textContent = '';
    block.appendChild(container);

    // eslint-disable-next-line no-console
    console.log('Fetching product data from:', apiUrl);

    // Fetch from API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
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
    // eslint-disable-next-line no-console
    console.error('Product table API error:', error);

    // 如果是CORS错误，提供更详细的信息
    if (error.message.includes('Failed to fetch')) {
      // eslint-disable-next-line no-console
      console.error('CORS issue detected. Please ensure the API server allows cross-origin requests.');
    }

    block.innerHTML = `
      <div class="error-message">
        <p>Error loading product data from API</p>
        <p class="error-details">${error.message}</p>
        <p class="error-details" style="font-size: 12px; margin-top: 10px;">
          API URL: ${apiUrl}<br>
          Check browser console for details
        </p>
      </div>
    `;
  }
}
