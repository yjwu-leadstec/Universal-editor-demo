# Product Table API - 简单使用说明

## 配置方式

### 方式1：使用默认API
```html
<div class="product-table">
  <div>
    <div>Title</div>
    <div>产品对比表</div>
  </div>
</div>
```
默认会使用: `https://publish-p80707-e1685574.adobeaemcloud.com/services/products/comparison`

### 方式2：自定义API URL
```html
<div class="product-table">
  <div>
    <div>Title</div>
    <div>产品对比表</div>
  </div>
  <div>
    <div>Source</div>
    <div>https://your-api-endpoint.com/products</div>
  </div>
</div>
```

## API要求

API必须返回以下格式的JSON数据：

```json
{
  "source": "描述",
  "units": {
    "字段名": "单位"
  },
  "products": [
    {
      "product_number": "产品编号",
      "status": "状态",
      "product_differences": ["特性1", "特性2"],
      "iq_typ_mA": 数值,
      "vin_min_v": 数值,
      "vin_max_v": 数值,
      "vout_min_v": 数值,
      "vout_max_v": 数值,
      "iout_max_a": 数值,
      "freq_typ_khz": 数值,
      "ron_hs_typ_mohm": 数值,
      "ron_ls_typ_mohm": 数值
    }
  ]
}
```

## 注意事项

- API必须支持CORS或通过代理访问
- 如果API需要认证，需要修改代码添加认证头
- 数据加载失败会显示错误信息