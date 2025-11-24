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

  // 默认使用AEM API端点（注意添加.json后缀）
  return 'https://publish-p80707-e1685574.adobeaemcloud.com/services/products/comparison.json';
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
 * @param {Object} data The product data from API
 * @returns {HTMLTableElement} The created table element
 */
function createProductTable(data) {
  const table = document.createElement('table');
  table.className = 'product-table';

  // Create table header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  // Define columns to display - 顺序与API返回数据一致
  const columns = [
    { key: 'productNumber', label: 'Product Number', sticky: true },
    { key: 'dataSheet', label: 'Data Sheet' },
    { key: 'status', label: 'Status' },
    { key: 'productDifferences', label: 'Product Differences' },
    { key: 'iq_typ_mA', label: 'IQ (mA)', spec: true },
    { key: 'vin_min_V', label: 'VIN Min (V)', spec: true },
    { key: 'vin_max_V', label: 'VIN Max (V)', spec: true },
    { key: 'vout_min_V', label: 'VOUT Min (V)', spec: true },
    { key: 'vout_max_V', label: 'VOUT Max (V)', spec: true },
    { key: 'outputAdjMethod', label: 'Output Adj Method', spec: true },
    { key: 'iout_max_A', label: 'IOUT Max (A)', spec: true },
    { key: 'currentLimit_typ_A', label: 'Current Limit (A)', spec: true },
    { key: 'freq_typ_kHz', label: 'Frequency (kHz)', spec: true },
    { key: 'ron_hs_typ_mOhm', label: 'RON HS (mΩ)', spec: true },
    { key: 'numberOfOutputs', label: 'Number of Outputs', spec: true },
    { key: 'extSync', label: 'Ext Sync', spec: true },
    { key: 'ron_ls_typ_mOhm', label: 'RON LS (mΩ)', spec: true },
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

  // 从新的数据结构中获取产品数组
  const products = data.productComparison?.products || data.products || [];

  products.forEach((product) => {
    const row = document.createElement('tr');
    row.setAttribute('data-product', product.productNumber || product.product_number);

    columns.forEach((col) => {
      const td = document.createElement('td');

      if (col.sticky) {
        td.className = 'sticky-column';
      }

      // 从specifications对象或直接从产品对象获取值
      let value;
      if (col.spec && product.specifications) {
        value = product.specifications[col.key];
      } else {
        value = product[col.key];
      }

      // Handle special formatting for certain columns
      switch (col.key) {
        case 'productDifferences':
          // Display as comma-separated list
          td.textContent = value ? value.join(', ') : '-';
          break;
        case 'dataSheet':
          // Display boolean as Yes/No
          td.textContent = value ? 'Yes' : 'No';
          break;
        case 'extSync':
          // Display boolean as Yes/No
          td.textContent = value ? 'Yes' : 'No';
          break;
        case 'status': {
          // Add status class for styling
          td.textContent = value || '-';
          const statusClass = value ? `status-${value.toLowerCase()}` : '';
          td.className = statusClass ? `${td.className} ${statusClass}` : td.className;
          break;
        }
        default: {
          // Default formatting
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

    // Clear loading state and add content
    container.innerHTML = '';

    // 直接添加表格，不添加额外的标题和过滤器
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
