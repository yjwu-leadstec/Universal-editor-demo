# AEM CRX/DE与Franklin Edge Delivery Services动态内容集成研究

## 概述
这个Franklin/Edge Delivery Services项目通过特定的架构实现与AEM CRX/DE的动态内容交互。系统采用了**内容获取->传输->客户端装饰**的三层模式。

---

## 1. Franklin Delivery API 集成

### 核心API端点
**fstab.yaml 配置：**
```yaml
mountpoints:
  /:
    url: "https://author-p80707-e1685574.adobeaemcloud.com/bin/franklin.delivery/yjwu-leadstec/Universal-editor-demo/main"
    type: "markup"
    suffix: ".html"
```

**关键组件：**
- **Franklin Delivery端点**: `/bin/franklin.delivery/` 
- **目的**: 将AEM中的内容（以markdown形式存储）转换为HTML标记
- **流程**: AEM CRX/DE → franklin.delivery → HTML markup → Edge Delivery CDN

### AEM 环境配置
**.env文件:**
```
AEM_AUTHOR_URL=https://author-p80707-e1685574.adobeaemcloud.com
AEM_PUBLISH_URL=https://publish-p80707-e1685574.adobeaemcloud.com
```

**用途：**
- 在本地开发和构建时引用AEM实例
- Editor支持脚本可使用这些URL进行内容更新

---

## 2. 动态数据获取机制

### A. Fragment Block - 核心动态加载
**文件**: `/blocks/fragment/fragment.js`

**功能**: 在运行时从AEM获取和包含外部内容

**实现细节：**
```javascript
// 1. 获取内容 (HTTP GET)
const resp = await fetch(`${path}.plain.html`);

// 2. 解析HTML
const main = document.createElement('main');
main.innerHTML = await resp.text();

// 3. 媒体URL重新映射 (处理相对路径)
main.querySelectorAll('img[src^="./media_"]').forEach((elem) => {
  elem.src = new URL(elem.getAttribute('src'), 
                     new URL(path, window.location)).href;
});

// 4. 装饰和加载块
decorateMain(main);
await loadSections(main);
```

**关键特性：**
- 动态获取`.plain.html`格式的内容 (Franklin自动转换)
- 支持跨路径内容包含
- 自动处理媒体资源映射
- 支持嵌套fragment (递归装饰)

### B. JavaScript API调用模式
**来源**: aem.js 和 scripts.js

**现有的API使用：**
1. **Image Optimization** - createOptimizedPicture()
   - 生成带参数的图片URL: `?width=750&format=webply&optimize=medium`
   - 这些参数被Franklin Delivery端点处理

2. **CSS和JS动态加载** - loadCSS(), loadScript()
   ```javascript
   async function loadCSS(href) {
     return new Promise((resolve, reject) => {
       const link = document.createElement('link');
       link.rel = 'stylesheet';
       link.href = href;
       link.onload = resolve;
       document.head.append(link);
     });
   }
   ```

3. **Block资源加载** - loadBlock()
   ```javascript
   async function loadBlock(block) {
     const cssLoaded = loadCSS(`${window.hlx.codeBasePath}/blocks/${blockName}/${blockName}.css`);
     const mod = await import(`${window.hlx.codeBasePath}/blocks/${blockName}/${blockName}.js`);
     if (mod.default) await mod.default(block);
   }
   ```

### C. 内容路径映射
**paths.json:**
```json
{
  "mappings": [
    "/content/demo-site/:/",
    "/content/demo-site/configuration:/.helix/config.json",
    "/content/demo-site/metadata:/metadata.json"
  ],
  "includes": ["/content/demo-site/"]
}
```

**映射规则：**
- `/content/demo-site/about` → `/about` (web URL)
- `/content/demo-site/configuration` → `/.helix/config.json`
- `/content/demo-site/metadata` → `/metadata.json`

**用途：** 在Franklin Delivery处理中映射JCR路径到web可访问路径

---

## 3. 内容存储库模式 (CRX/JCR)

### A. JCR结构
```
/content/demo-site/
├── pages/
│   ├── home
│   ├── about
│   ├── contact
│   └── ...
├── dam/ (数字资产)
│   ├── avatar.jpg
│   ├── hero-image.png
│   └── ...
├── configuration/
│   └── config.json
└── metadata/
    └── metadata.json
```

### B. 内容获取流程 (Franklin编码)

**编辑器到服务器：**
1. **Universal Editor中的编辑** → xwalk插件编码
2. **xwalk编码输出** → HTML/Markdown格式
3. **AEM存储** → /content/demo-site路径
4. **Webhook触发** → AEM Code Sync GitHub App
5. **Git同步** → 推送到GitHub

**Server to Browser:**
1. **Git存储** → .md文件和资源
2. **Franklin Delivery** → 处理markdown生成HTML
3. **Edge Delivery CDN** → 缓存和分发
4. **浏览器** → 接收最终HTML

### C. 块数据结构 (从AEM出来)
Avatar块示例 (Franklin Delivery输出的HTML)：
```html
<div class="avatar block" data-block-name="avatar" data-aue-resource="/content/demo-site/home">
  <div>
    <picture>
      <source media="(min-width: 600px)" 
              srcset="/media_xxx.png?width=2000&format=webply&optimize=medium" 
              type="image/webp"/>
      <img src="/media_xxx.png?width=750&format=png&optimize=medium" 
           loading="lazy" alt="User Avatar"/>
    </picture>
  </div>
  <div>John Doe</div>
  <div>Software Engineer</div>
  <div>medium</div>
</div>
```

**关键属性：**
- `data-block-name="avatar"` - 块类型标识
- `data-aue-resource="/content/demo-site/home"` - 编辑器资源路径
- `data-aue-prop` - 编辑器字段路径 (在装饰中添加)
- `data-richtext-*` - 富文本编辑标记

---

## 4. 实时数据集成模式

### A. Universal Editor 连接 (编辑器支持)
**文件**: `/scripts/editor-support.js`

**事件监听**:
```javascript
[
  'aue:content-patch',      // 单个字段更新
  'aue:content-update',     // 组件更新
  'aue:content-add',        // 添加新内容
  'aue:content-move',       // 移动内容
  'aue:content-remove',     // 删除内容
  'aue:content-copy'        // 复制内容
]
```

**实时更新流程**:
1. **编辑器事件触发** → aue:content-patch
2. **applyChanges()被调用** → 获取新的HTML内容
3. **DOMPurify清理** → 防止XSS
4. **DOM解析** → new DOMParser()
5. **元素替换** → replaceWith() / insertAdjacentElement()
6. **重新装饰** → decorateMain(), decorateBlock()
7. **加载区块** → loadBlock(), loadSections()
8. **事件绑定** → attachEventListners()

### B. 数据-AUE资源映射
```javascript
// 获取更新资源
const resource = detail?.request?.target?.resource;

// 在DOM中定位
const element = document.querySelector(`[data-aue-resource="${resource}"]`);

// 应用更改
element.replaceWith(...newElements);
```

### C. 内容更新数据流
```
Universal Editor (编辑)
    ↓
xwalk Plugin (序列化)
    ↓
AEM Author (存储)
    ↓
Event: aue:content-patch
    ↓
applyChanges() (重新装饰)
    ↓
浏览器DOM (实时更新)
```

---

## 5. Editor集成详解

### A. xwalk组件定义
**来源**: `/blocks/avatar/_avatar.json`

```json
{
  "plugins": {
    "xwalk": {
      "page": {
        "resourceType": "core/franklin/components/block/v1/block",
        "template": {
          "name": "Avatar",
          "model": "avatar",
          "image": "/content/dam/default-avatar.png",
          "imageAlt": "User Avatar",
          "personName": "John Doe",
          "title": "Software Engineer",
          "size": "medium"
        }
      }
    }
  },
  "models": [
    {
      "id": "avatar",
      "fields": [
        {
          "component": "reference",
          "name": "image",
          "label": "Avatar Image",
          "required": true
        },
        {
          "component": "text",
          "name": "imageAlt",
          "label": "Image Alt Text",
          "required": true
        },
        {
          "component": "text",
          "name": "personName",
          "label": "Name",
          "required": true
        },
        {
          "component": "select",
          "name": "size",
          "label": "Avatar Size",
          "options": [
            {"name": "Small (64px)", "value": "small"},
            {"name": "Medium (128px)", "value": "medium"},
            {"name": "Large (256px)", "value": "large"}
          ]
        }
      ]
    }
  ]
}
```

### B. 数据-DOM元素连接

**moveInstrumentation()函数** (scripts.js):
```javascript
export function moveInstrumentation(from, to) {
  moveAttributes(
    from, to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') 
                     || attr.startsWith('data-richtext-'))
  );
}
```

**作用**:
- 保留编辑器属性: `data-aue-*`, `data-richtext-*`
- 允许编辑器追踪DOM到模型字段的映射
- 确保实时编辑时知道更新哪些字段

### C. 块装饰中的编辑器支持

Avatar块装饰示例:
```javascript
// 保留图片行的编辑器属性
moveInstrumentation(imageRow, imageWrapper);

// 保留名称的编辑器属性
moveInstrumentation(nameRow, nameElement);

// 保留标题的编辑器属性
moveInstrumentation(titleRow, titleElement);
```

---

## 6. 配置和环境

### A. Helix Query索引
**helix-query.yaml**:
```yaml
indices:
  pages:
    include: ['/**']
    exclude: ['/**.json']
    target: /query-index.json
    properties:
      lastModified:
        select: head > meta[name="robots"]
```

**用途**: 构建可查询索引，支持搜索和列表功能

### B. Head.html引入
**head.html**:
```html
<script src="/scripts/aem.js" type="module"></script>
<script src="/scripts/scripts.js" type="module"></script>
<link rel="stylesheet" href="/styles/styles.css"/>
```

**加载顺序**:
1. aem.js - 核心utilities和块加载
2. scripts.js - 初始化和装饰
3. 编辑器支持 (editor-support.js) - 由scripts.js动态加载

---

## 7. 页面生命周期 (内容流动)

### A. 初始页面加载
```
1. Browser请求HTML
   ↓
2. Franklin Delivery处理 (/bin/franklin.delivery/...)
   ↓
3. 从Git获取markdown/content
   ↓
4. 转换为HTML块标记
   ↓
5. 返回完整HTML页面
   ↓
6. Browser渲染HTML
```

### B. 块装饰阶段
```
loadEager()
  → decorateMain()
    → decorateSections()
    → decorateBlocks()
      → 标记block元素
    → loadSection(第一个)
      → loadBlock()
        → 加载CSS
        → 动态导入JS
        → 执行decorate()函数
        → moveInstrumentation()保留编辑器属性

loadLazy()
  → loadSections()
    → 加载其他所有blocks

loadDelayed()
  → 3秒后加载非关键功能
```

### C. 编辑器事件处理
```
用户在Editor中编辑
  ↓
aue:content-patch事件
  ↓
applyChanges()
  ↓
fetch新HTML
  ↓
DOMPurify.sanitize()
  ↓
DOM.parseFromString()
  ↓
replaceElement()
  ↓
重新装饰块
  ↓
实时显示在浏览器
```

---

## 8. 块级数据流 (详细示例)

### Avatar块完整流程

**1. AEM编辑器中的数据：**
- image: `/content/dam/avatar.jpg` (reference字段)
- imageAlt: `Profile Photo` (text字段)
- personName: `Jane Smith` (text字段)
- title: `Product Designer` (text字段)
- size: `large` (select字段)

**2. Franklin Delivery转换后 (markdown → HTML):**
```html
<div class="avatar block" data-block-name="avatar" 
     data-aue-resource="/content/demo-site/home/avatar[0]">
  <div data-aue-prop="image">
    <picture>
      <source srcset="/content/dam/avatar.jpg?width=2000..."/>
      <img src="/content/dam/avatar.jpg?width=750..." alt="Profile Photo"/>
    </picture>
  </div>
  <div data-aue-prop="personName">Jane Smith</div>
  <div data-aue-prop="title">Product Designer</div>
  <div data-aue-prop="size">large</div>
</div>
```

**3. 客户端装饰 (avatar.js):**
- 解析行: 识别图片、名称、标题、大小
- 创建结构: avatar-container, avatar-image-wrapper, avatar-info
- 应用样式: size-large类
- 保留编辑器属性: moveInstrumentation()
- 最终HTML (结构化)

**4. 编辑时更新 (例如改变size为'medium'):**
- Editor发送: aue:content-patch
- 新HTML返回: `<div class="avatar block"...><div>medium</div></div>`
- applyChanges()执行:
  - 替换block
  - 重新运行avatar.js decorate()
  - DOM更新为size-medium类
  - 浏览器实时显示

---

## 9. 关键技术特性

### A. 无需后端API的动态加载
- **Fragment块**: 使用fetch API获取预渲染HTML
- **无GraphQL/REST**: 不需要自定义API端点
- **CDN友好**: 所有内容可缓存

### B. 编辑器真实性
- **实时预览**: 编辑→自动更新
- **所见即所得**: Universal Editor中的展示
- **客户端重新装饰**: 快速响应

### C. 媒体优化
- **动态图片参数**: `?width=X&format=Y&optimize=Z`
- **Franklin处理**: 自动图片优化和转换
- **响应式源**: 多breakpoint和格式

### D. SEO支持
- **静态HTML**: 完整的pre-rendered content
- **元数据**: head中的标准meta标签
- **查询索引**: helix-query.yaml构建搜索能力

---

## 10. 完整架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    AEM Cloud Service                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ CRX/JCR Repository (/content/demo-site/...)         │  │
│  │ - Pages as markdown                                 │  │
│  │ - DAM assets (/content/dam/...)                     │  │
│  │ - Configuration and metadata                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│                    /bin/franklin.delivery/                  │
│                 (HTML生成和优化)                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐  ┌────▼──────┐  ┌──▼──────────┐
│ GitHub Repo  │  │Edge CDN   │  │Universal    │
│(Git Sync)    │  │(Cache)    │  │Editor       │
│- markdown    │  │- HTML     │  │(WYSIWYG)    │
│- Assets      │  │- CSS      │  │- xwalk      │
│- Config      │  │- JS       │  │- Real-time  │
└──────────────┘  └───────────┘  └─────────────┘
        │              │              │
        └──────────────┴──────────────┘
                       │
                Browser & Client
        ┌──────────────────────────────┐
        │  Edge Delivery Services      │
        │  ┌────────────────────────┐  │
        │  │ HTML从Franklin获取     │  │
        │  │ + JS modules           │  │
        │  │ (aem.js, scripts.js)   │  │
        │  └────────────────────────┘  │
        │         │                    │
        │    decorateBlocks()          │
        │    loadBlock()               │
        │    块装饰函数执行            │
        │         │                    │
        │    moveInstrumentation()     │
        │    保留编辑器属性            │
        │         │                    │
        │    editor-support.js         │
        │    监听aue:*事件             │
        │         │                    │
        │    applyChanges()            │
        │    实时更新                   │
        └────────────────────────────────┘
```

---

## 11. 技术栈总结

| 层 | 组件 | 技术 | 用途 |
|---|------|------|------|
| **编辑** | Universal Editor | xwalk插件 | 可视编辑和内容建模 |
| **存储** | AEM Cloud | CRX/JCR | 内容存储库 |
| **交付** | Franklin Delivery | /bin/franklin.delivery | 内容→HTML转换 |
| **缓存** | Edge Delivery CDN | 全球CDN | HTML/CSS/JS分发 |
| **版本控制** | GitHub | Git + AEM Code Sync | 源代码管理 |
| **前端** | JavaScript | ES6 modules | 块装饰和交互 |
| **实时编辑** | Editor Support | aue事件 | 动态更新DOM |

---

## 总结

这个项目实现了一个**完全托管的、编辑器驱动的Edge Delivery系统**:

1. **内容创建**: 在Universal Editor中使用xwalk组件
2. **内容存储**: AEM CRX/DE保存markdown形式
3. **内容交付**: Franklin Delivery转换为HTML
4. **缓存分发**: Edge CDN全球分发
5. **客户端装饰**: JavaScript块装饰器结构化HTML
6. **实时更新**: editor-support.js监听编辑事件
7. **编辑器链接**: data-aue-*属性保持映射

**关键优势**:
- 无需自定义API
- 所有内容可缓存
- 实时编辑预览
- SEO友好的静态HTML
- 快速CDN分发
