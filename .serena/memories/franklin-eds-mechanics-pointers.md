# Franklin/EDS 核心机制 — 速查指针

**这条是指针，不是副本。** 机制细节以仓库内真实文件为准，别在记忆里存代码副本（会过期）。

## 直接读源码（都在仓库里，最权威）
| 想了解 | 读这个 |
|---|---|
| `createOptimizedPicture` / `decorateBlock` / `loadBlock` / `buildBlock` / RUM / 三阶段加载 | `scripts/aem.js`（716 行，AEM boilerplate 原版，未魔改） |
| 项目自己的装饰逻辑、`moveInstrumentation` | `scripts/scripts.js` |
| UE 实时编辑事件（`aue:content-*`）处理 | `scripts/editor-support.js` |
| 产品族 block 公共工具 + **发布态标记重建** | `scripts/product-block-utils.js`（`PRODUCT_MODEL_FIELDS` / `restorePublishedMarkup`） |
| 服务族 block 公共工具 | `scripts/service-block-utils.js` |
| Block 开发范式（模板字符串 vs lit-html、XSS、moveInstrumentation） | 根目录 `EDS_Block_Development_Guide.md`（182 行） |

## 内容交付链路（记住这条即可）
```
AEM author (/content/demo-site/, JCR)
  → /bin/franklin.delivery/yjwu-leadstec/Universal-editor-demo/main   ← fstab.yaml mountpoint
  → HTML markup → Edge Delivery CDN
  → 浏览器：aem.js decorateBlocks → loadBlock → 各 block decorate()
```
- `paths.json` 把 `/content/demo-site/X` 映射成 web 路径 `/X`。
- **`data-aue-*` 只在 UE 编辑态存在，发布交付里没有** → 见 `mem:service-blocks-publish-safe-fix`（这是最容易踩的坑）。
- `fragment` block 靠 `fetch(path + '.plain.html')` 做运行时内容包含。

## 动态查询/过滤（探索性，未落地）
`helix-query.yaml` 存在（构建 `query-index.json` 索引），但**项目里目前没有 block 真正消费 query-index 做动态过滤**。若将来要做列表/筛选页，方向是 `query-index.json` + ffetch 惰性分页；届时按当时的 aem.live 官方文档重新确认，不要依赖旧调研结论。

相关：`mem:project-overview`、`mem:service-blocks-publish-safe-fix`、`mem:home-blocks-development`。
