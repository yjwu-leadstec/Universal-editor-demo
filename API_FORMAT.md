# Product Table API Format

## 默认API端点
`https://publish-p80707-e1685574.adobeaemcloud.com/services/products/comparison.json`

## 数据格式

```json
{
  "productComparison": {
    "title": "Product Comparison Table",
    "lastUpdated": "2025-11-24",
    "products": [
      {
        "productNumber": "RT5760A",
        "dataSheet": true,
        "status": "Active",
        "productDifferences": ["Power Good", "PSM"],
        "specifications": {
          "iq_typ_mA": 0.025,
          "vin_min_V": 2.5,
          "vin_max_V": 6.0,
          "vout_min_V": 0.6,
          "vout_max_V": 6.0,
          "outputAdjMethod": "Resistor",
          "iout_max_A": 1,
          "currentLimit_typ_A": 2.65,
          "freq_typ_kHz": 2200,
          "ron_hs_typ_mOhm": 120,
          "numberOfOutputs": 1,
          "extSync": false,
          "ron_ls_typ_mOhm": 80
        }
      }
    ]
  }
}
```

## 字段说明

### 顶层字段
- `productComparison`: 包含所有对比数据的容器对象
- `title`: 表格标题（可选）
- `lastUpdated`: 最后更新日期（可选）
- `products`: 产品数组

### 产品字段
- `productNumber`: 产品编号（必需）
- `status`: 产品状态（如 Active, Preview）
- `productDifferences`: 产品特性数组
- `specifications`: 产品规格对象

### 规格字段（specifications）
- `iq_typ_mA`: 典型静态电流（毫安）
- `vin_min_V` / `vin_max_V`: 输入电压范围（伏特）
- `vout_min_V` / `vout_max_V`: 输出电压范围（伏特）
- `iout_max_A`: 最大输出电流（安培）
- `freq_typ_kHz`: 典型频率（千赫兹）
- `ron_hs_typ_mOhm`: 高侧导通电阻（毫欧）
- `ron_ls_typ_mOhm`: 低侧导通电阻（毫欧）

## 使用说明

在block中配置：

```html
<div class="product-table">
  <div>
    <div>Title</div>
    <div>产品对比表</div>
  </div>
  <div>
    <div>Source</div>
    <div>https://your-api-endpoint.json</div>
  </div>
</div>
```

如果不配置Source，将使用默认的API端点。