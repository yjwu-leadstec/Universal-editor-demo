# Product Table API Integration

## 实现日期
2024-11-24

## 功能改造
将Product Table block的数据源从本地JSON文件改为支持API调用

## API端点
https://publish-p80707-e1685574.adobeaemcloud.com/services/products/comparison.json

## 核心改动

### 1. product-table.js
- 修改`getJsonPaths()`函数，添加对HTTP/HTTPS URL的识别
- 在fetch请求中添加CORS模式和必要的headers
- 保留fallback到本地数据的功能

### 2. 关键代码片段
```javascript
// 检查是否是API URL
if (configSource && (configSource.startsWith('http://') || configSource.startsWith('https://'))) {
  paths.push(configSource);
  return paths;
}

// API请求配置
response = await fetch(jsonPath, {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  ...(isApiUrl ? { mode: 'cors' } : {})
});
```

### 3. 使用方式
在block配置中直接使用API URL：
```html
<div class="product-table">
  <div>
    <div>Source</div>
    <div>https://publish-p80707-e1685574.adobeaemcloud.com/services/products/comparison</div>
  </div>
</div>
```

## CORS处理
- 如果遇到CORS问题，需要：
  1. 在API服务器端配置CORS
  2. 或使用本地代理服务器
  3. 或配置AEM Edge Delivery代理

## 测试文件
- `/test-api-product-table.html` - API测试页面

## 数据源
仅从API获取数据，不使用本地fallback。
如果API请求失败，显示错误信息。

## 新的API数据格式（2025-11-24更新）
数据结构包装在productComparison对象中：
- products数组路径：`data.productComparison.products`
- 产品标识：`productNumber`（而非`product_number`）
- 规格数据在`specifications`对象中
- 字段名大小写变化：如`vin_min_V`而非`vin_min_v`