import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * 获取产品数据的API URL
 * 功能：根据配置决定使用自定义URL还是默认API端点
 * @param {string} configSource 从block配置中读取的source路径
 * @returns {string} 最终使用的API URL
 */
function getApiUrl(configSource) {
  // 检查是否配置了完整的HTTP/HTTPS URL
  // 如果用户在block中提供了完整的API地址，优先使用用户配置
  if (configSource && (configSource.startsWith('http://') || configSource.startsWith('https://'))) {
    return configSource;
  }

  // 如果没有配置或配置的不是完整URL，使用默认的AEM author实例API端点
  // 这个端点返回产品对比数据的JSON格式
  return 'https://author-p80707-e1685574.adobeaemcloud.com/bin/venia/products/comparison.json';
}

/**
 * 从block内容中读取配置信息
 * 功能：解析block中的表格配置，将第一列作为key，第二列作为value
 * 配置示例：
 * | Title  | Product Comparison |
 * | Source | https://api.example.com/products.json |
 * @param {Element} block Product Table block的DOM元素
 * @returns {Object} 包含配置键值对的对象，如 {title: "Product Comparison", source: "url"}
 */
function readBlockConfig(block) {
  const config = {};

  // 遍历block中的每一行（每个div代表一行）
  block.querySelectorAll(':scope > div').forEach((row) => {
    const cols = [...row.children];
    // 如果这一行有两列（配置行格式）
    if (cols[1]) {
      // 第一列作为配置名，转换为小写并用下划线替换空格
      // 例如："Source Path" -> "source_path"
      const key = cols[0].textContent.trim().toLowerCase().replace(/\s+/g, '_');
      // 第二列作为配置值
      const value = cols[1].textContent.trim();
      config[key] = value;
    }
  });

  return config;
}

/**
 * 创建产品对比表格
 * 功能：根据API返回的数据动态生成HTML表格
 * @param {Object} data 从API获取的产品数据对象
 * @returns {HTMLElement} 包含表格的wrapper div元素
 */
function createProductTable(data) {
  const table = document.createElement('table');
  table.className = 'product-table';

  // 创建表格头部
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  // 定义要显示的列 - 顺序严格与API返回的数据字段顺序保持一致
  // key: API数据中的字段名
  // label: 表格中显示的列标题
  // sticky: 是否为固定列（横向滚动时保持可见）
  // spec: 是否从specifications对象中获取值
  const columns = [
    { key: 'productNumber', label: 'Product Number', sticky: true }, // 产品编号，固定列
    { key: 'dataSheet', label: 'Data Sheet' }, // 数据手册
    { key: 'status', label: 'Status' }, // 产品状态
    { key: 'productDifferences', label: 'Product Differences' }, // 产品特性差异
    { key: 'iq_typ_mA', label: 'IQ (mA)', spec: true }, // 静态电流
    { key: 'vin_min_V', label: 'VIN Min (V)', spec: true }, // 最小输入电压
    { key: 'vin_max_V', label: 'VIN Max (V)', spec: true }, // 最大输入电压
    { key: 'vout_min_V', label: 'VOUT Min (V)', spec: true }, // 最小输出电压
    { key: 'vout_max_V', label: 'VOUT Max (V)', spec: true }, // 最大输出电压
    { key: 'outputAdjMethod', label: 'Output Adj Method', spec: true }, // 输出调节方式
    { key: 'iout_max_A', label: 'IOUT Max (A)', spec: true }, // 最大输出电流
    { key: 'currentLimit_typ_A', label: 'Current Limit (A)', spec: true }, // 电流限制
    { key: 'freq_typ_kHz', label: 'Frequency (kHz)', spec: true }, // 工作频率
    { key: 'ron_hs_typ_mOhm', label: 'RON HS (mΩ)', spec: true }, // 高侧导通电阻
    { key: 'numberOfOutputs', label: 'Number of Outputs', spec: true }, // 输出数量
    { key: 'extSync', label: 'Ext Sync', spec: true }, // 外部同步
    { key: 'ron_ls_typ_mOhm', label: 'RON LS (mΩ)', spec: true }, // 低侧导通电阻
  ];

  // 创建表格头部单元格
  columns.forEach((col) => {
    const th = document.createElement('th');
    th.textContent = col.label;
    // 如果是sticky列，添加对应的CSS类使其在横向滚动时保持固定
    if (col.sticky) {
      th.className = 'sticky-column';
    }
    // 添加data属性，便于后续操作和样式定制
    th.setAttribute('data-column', col.key);
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // 创建表格主体
  const tbody = document.createElement('tbody');

  // 从API返回的数据结构中获取产品数组
  // 优先从新格式（productComparison.products）获取，兼容旧格式（products）
  const products = data.productComparison?.products || data.products || [];

  // 遍历每个产品，创建表格行
  products.forEach((product) => {
    const row = document.createElement('tr');
    // 设置产品标识属性，便于后续操作（如过滤、搜索）
    row.setAttribute('data-product', product.productNumber || product.product_number);

    // 为每个产品创建单元格
    columns.forEach((col) => {
      const td = document.createElement('td');

      // 如果是固定列，添加CSS类
      if (col.sticky) {
        td.className = 'sticky-column';
      }

      // 根据列配置从不同位置获取数据值
      // spec=true的字段从specifications对象获取
      // 其他字段直接从产品对象获取
      let value;
      if (col.spec && product.specifications) {
        value = product.specifications[col.key];
      } else {
        value = product[col.key];
      }

      // 根据不同字段类型进行特殊格式化处理
      switch (col.key) {
        case 'productDifferences':
          // 产品特性数组转换为逗号分隔的字符串
          td.textContent = value ? value.join(', ') : '-';
          break;
        case 'dataSheet':
          // 布尔值转换为Yes/No显示
          td.textContent = value ? 'Yes' : 'No';
          break;
        case 'extSync':
          // 布尔值转换为Yes/No显示
          td.textContent = value ? 'Yes' : 'No';
          break;
        case 'status': {
          // 状态字段添加特殊样式类（如active、inactive等）
          td.textContent = value || '-';
          const statusClass = value ? `status-${value.toLowerCase()}` : '';
          td.className = statusClass ? `${td.className} ${statusClass}` : td.className;
          break;
        }
        default: {
          // 默认处理：空值显示为"-"
          td.textContent = value !== undefined && value !== null ? value : '-';
        }
      }

      row.appendChild(td);
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);

  // 添加表格包装器，用于处理横向滚动
  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'table-wrapper';
  tableWrapper.appendChild(table);

  return tableWrapper;
}

/**
 * 主装饰函数 - AEM Edge Delivery Services的入口点
 * 功能：异步加载API数据并创建产品对比表格
 * 执行流程：
 * 1. 读取block配置
 * 2. 确定API URL
 * 3. 显示加载状态
 * 4. 调用API获取数据
 * 5. 创建并显示表格
 * 6. 处理错误情况
 * @param {Element} block Product Table block的DOM元素
 */
export default async function decorate(block) {
  // 从block内容读取配置（如自定义API URL）
  const config = readBlockConfig(block);

  // 获取最终使用的API URL（配置的或默认的）
  const apiUrl = getApiUrl(config.source);

  try {
    // 创建容器元素，用于显示加载状态和最终的表格
    const container = document.createElement('div');
    container.className = 'product-table-container';

    // 显示加载提示，改善用户体验
    container.innerHTML = '<p class="loading">Loading product data from API...</p>';
    block.textContent = '';
    block.appendChild(container);

    // 控制台输出，便于调试
    // eslint-disable-next-line no-console
    console.log('Fetching product data from:', apiUrl);

    // 调用API获取产品数据
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json', // 指定接受JSON格式响应
        'Content-Type': 'application/json',
      },
      mode: 'cors', // 允许跨域请求
    });

    // 检查响应状态，非200状态码抛出错误
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    // 解析JSON响应数据
    const data = await response.json();

    // 使用获取的数据创建表格
    const table = createProductTable(data);

    // 清除加载状态
    container.innerHTML = '';

    // 将生成的表格添加到容器中
    // 注意：这里只添加纯表格，不包含标题、过滤器等额外元素
    container.appendChild(table);

    // 保留Universal Editor的编辑功能标记
    // 这确保在Universal Editor中可以正确编辑此block
    moveInstrumentation(block, container);
  } catch (error) {
    // 错误处理：在控制台记录详细错误信息
    // eslint-disable-next-line no-console
    console.error('Product table API error:', error);

    // 针对CORS错误提供额外的调试信息
    // CORS错误通常表现为"Failed to fetch"
    if (error.message.includes('Failed to fetch')) {
      // eslint-disable-next-line no-console
      console.error('CORS issue detected. Please ensure the API server allows cross-origin requests.');
    }

    // 显示用户友好的错误消息
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
