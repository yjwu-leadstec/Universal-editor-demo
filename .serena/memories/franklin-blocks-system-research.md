# Franklin Blocks系统详细研究报告

## 1. 什么是Franklin Blocks及其目的

### Franklin Blocks的定义
Franklin blocks是AEM Edge Delivery Services中的模块化内容组件系统。它们是：
- **轻量级、可重用的内容模块**，用于构建网页
- **与Universal Editor集成**，允许编者通过可视化界面创建内容
- **后端渲染模式**，从AEM服务器以HTML标记形式发送
- **包含CSS和JavaScript装饰**的客户端增强

### 在AEM Edge Delivery Services中的目的
1. **内容建模** - 定义编辑者在Universal Editor中可用的组件
2. **灵活性** - 支持各种页面布局和内容类型
3. **性能优化** - 轻量级组件，快速加载和渲染
4. **编者友好** - 直观的编辑界面，无需代码知识

## 2. Blocks的结构和实现模式

### 目录结构
```
blocks/
├── avatar/
│   ├── avatar.js          # 客户端装饰脚本
│   ├── avatar.css         # 样式定义
│   └── _avatar.json       # 内容模型定义（xwalk模式）
├── hero/
│   ├── hero.js
│   ├── hero.css
│   └── _hero.json
├── cards/
│   ├── cards.js
│   ├── cards.css
│   └── _cards.json
├── columns/
├── fragment/
├── quote/
├── header/
├── footer/
└── [其他块...]
```

### Block文件组成
每个块包含三个主要部分：

1. **JSON模型文件** (_blockname.json) - 定义数据模型和UI
2. **JavaScript装饰脚本** (blockname.js) - 处理DOM转换
3. **CSS样式** (blockname.css) - 视觉设计

## 3. Franklin Blocks与Universal Editor的关系

### xwalk插件（XWalk = eXtensible Walkthrough）
Universal Editor通过xwalk插件与blocks集成：

```json
{
  "plugins": {
    "xwalk": {
      "page": {
        "resourceType": "core/franklin/components/block/v1/block",
        "template": {
          "name": "Avatar",
          "model": "avatar"
        }
      }
    }
  }
}
```

### 配置层次
1. **component-definition.json** - 在Universal Editor中公开的组件
2. **_blockname.json** - 具体block的定义和数据模型
3. **component-filters.json** - 定义哪些组件可在哪些上下文中使用

### 数据流向
```
Universal Editor (编辑器UI)
        ↓
xwalk Plugin (通信层)
        ↓
AEM Server (内容存储)
        ↓
Franklin Delivery (HTML生成)
        ↓
Edge Delivery (缓存和分发)
        ↓
浏览器 (接收HTML + CSS/JS)
```

## 4. Blocks的装饰和渲染过程

### 渲染流程（3个阶段）

#### 第1阶段：初始化 (loadEager)
- `decorateMain()` 被调用（scripts.js）
- `decorateBlocks()` 标记所有块元素
- 将class名转换为data-block-name属性
- 标记为"initialized"状态

#### 第2阶段：装饰装载 (loadSection/loadBlock)
```javascript
// aem.js 中的loadBlock函数
async function loadBlock(block) {
  // 1. 加载CSS文件
  const cssLoaded = loadCSS(`/blocks/${blockName}/${blockName}.css`);
  
  // 2. 动态导入并执行JS模块
  const mod = await import(`/blocks/${blockName}/${blockName}.js`);
  await mod.default(block);  // 调用decorate函数
  
  // 3. 标记为"loaded"
  block.dataset.blockStatus = 'loaded';
}
```

#### 第3阶段：DOM变换（具体实现）
每个块的default export函数接收block元素并转换DOM：

**Avatar Block示例** (avatar.js)：
```javascript
export default function decorate(block) {
  // 从block的行中提取数据
  const rows = [...block.children];
  
  // 创建新的DOM结构
  const avatarContainer = document.createElement('div');
  avatarContainer.className = 'avatar-container';
  
  // 处理图片、名字、标题等
  // 使用moveInstrumentation保留编辑器元数据
  moveInstrumentation(imageRow, imageWrapper);
  
  // 用新结构替换原block内容
  block.textContent = '';
  block.appendChild(avatarContainer);
}
```

### 关键函数

| 函数 | 位置 | 功能 |
|------|------|------|
| `decorateBlocks()` | aem.js | 标记和初始化所有块 |
| `decorateBlock()` | aem.js | 对单个块应用基础装饰 |
| `loadBlock()` | aem.js | 加载块的CSS/JS并执行装饰 |
| `loadSection()` | aem.js | 加载节内的所有块 |
| `wrapTextNodes()` | aem.js | 将文本内容包装在段落中 |
| `moveInstrumentation()` | scripts.js | 保留编辑器元数据属性 |

## 5. 数据流（从编辑到渲染）

### 编辑到服务器
1. **编辑器** - 编者在Universal Editor中填写Avatar块的字段
   - image: /content/dam/avatar.jpg
   - imageAlt: "User Avatar"
   - personName: "John Doe"
   - title: "Software Engineer"
   - size: "medium"

2. **xwalk编码** - Universal Editor将数据转换为HTML/markdown格式

3. **AEM存储** - 内容保存到AEM服务器（/content/demo-site/...）

### 服务器到浏览器
1. **Franklin Delivery** - AEM franklin.delivery端点：
   - URL: https://author-p80707.adobeaemcloud.com/bin/franklin.delivery/...
   - 生成HTML标记

2. **HTML结构** - Avatar块来自服务器的HTML：
   ```html
   <div class="avatar block" data-block-name="avatar">
     <div>
       <picture>...</picture>
     </div>
     <div>John Doe</div>
     <div>Software Engineer</div>
     <div>medium</div>
   </div>
   ```

3. **客户端装饰** (avatar.js)
   - 解析行
   - 识别图片、名字、标题、大小
   - 创建结构化HTML
   - 应用CSS类

4. **最终输出**
   ```html
   <div class="avatar block" data-block-name="avatar">
     <div class="avatar-container size-medium">
       <div class="avatar-image-wrapper">
         <picture>...</picture>
       </div>
       <div class="avatar-info">
         <h3 class="avatar-name">John Doe</h3>
         <p class="avatar-title">Software Engineer</p>
       </div>
     </div>
   </div>
   ```

## 6. 块示例分析

### Avatar Block
- **文件** - /blocks/avatar/
- **模型** - avatar.json (5个字段：image, imageAlt, personName, title, size)
- **装饰** - avatar.js (130行代码，处理行解析和DOM构建)
- **样式** - avatar.css (215行，包括responsive + columns覆盖)
- **特点** - 支持3种大小，圆形头像，带标题信息

### Hero Block
- **文件** - /blocks/hero/
- **模型** - hero.json (3个字段：image, imageAlt, text)
- **装饰** - hero.js (1行，注释指出是minimal实现)
- **样式** - hero.css (37行，背景图片定位，响应式)
- **特点** - 全宽背景图，文本叠加

### Cards Block
- **文件** - /blocks/cards/
- **模型** - cards.json (定义cards容器和card子项)
- **装饰** - cards.js (24行，转换为ul/li结构)
- **样式** - cards.css (网格布局)
- **特点** - 支持多个card项目，使用createOptimizedPicture

### Columns Block
- **文件** - /blocks/columns/
- **模型** - columns.json (支持嵌套的column组件)
- **装饰** - columns.js (18行，检测列数和图片列)
- **样式** - columns.css (响应式网格)
- **特点** - 灵活的多列布局，支持嵌套内容

### Fragment Block
- **文件** - /blocks/fragment/
- **功能** - 在页面中包含其他页面的内容
- **装饰** - fragment.js (59行，获取和集成外部内容)
- **特点** - 支持路径解析，媒体URL重新映射，递归装饰

### Quote Block
- **文件** - /blocks/quote/
- **模型** - quote.json (quote + author字段)
- **装饰** - quote.js (12行)
- **样式** - quote.css (blockquote样式)
- **特点** - Simple blockquote实现

## 7. paths.json 的作用

```json
{
  "mappings": [
    "/content/demo-site/:/",
    "/content/demo-site/configuration:/.helix/config.json",
    "/content/demo-site/metadata:/metadata.json"
  ],
  "includes": [
    "/content/demo-site/"
  ]
}
```

- **路径映射** - 将AEM内容路径映射到Web路径
- **/content/demo-site/** → 根目录 **/**
- 用于配置和元数据位置
- **不直接涉及块路由**

## 8. 关键架构要素

### 块加载顺序
```
1. loadEager()
   - decorateMain()
     - decorateButtons()
     - decorateIcons()
     - decorateSections()
     - decorateBlocks()  ← 标记blocks
   - loadSection(first)  ← 加载第一个section
     - loadBlock()       ← 加载每个block的CSS/JS

2. loadLazy()
   - loadSections()     ← 加载其他sections
     - loadSection()
       - loadBlock()

3. loadDelayed()
   - delayed.js (3秒后)
```

### moveInstrumentation用途
```javascript
moveInstrumentation(from, to)
```
- 复制编辑器属性：`data-aue-*` 和 `data-richtext-*`
- 保留文本内容与编辑器的连接
- 允许Universal Editor知道哪些DOM元素对应哪些数据字段

### Component Definition Structure
```json
{
  "title": "Avatar",
  "id": "avatar",
  "plugins": {
    "xwalk": {
      "page": {
        "resourceType": "core/franklin/components/block/v1/block",
        "template": {
          "name": "Avatar",
          "model": "avatar"
        }
      }
    }
  }
}
```

## 9. 配置文件关系

### component-definition.json
- 定义在Universal Editor中显示的组件
- resourceType指向block或其他component类型
- 使用xwalk插件与编辑器通信

### component-filters.json
- 定义组件的可用性约束
- 例如："cards"块只能包含"card"子项
- 强制UI中的正确层级结构

### component-models.json
- 定义每个组件的数据字段
- 包括字段类型（text, reference, richtext等）
- 验证和UI生成

### _blockname.json
- Block特定的定义和模型
- 与component-definition.json相镜像
- 可能用于静态模式（非Universal Editor）

## 10. 性能和最佳实践

### Eager vs Lazy加载
- **Eager** - 第一个section在loadEager中加载（LCP）
- **Lazy** - 其他sections在loadLazy中加载
- **Delayed** - 非关键功能在3秒后加载

### CSS优化
- 每个块有自己的CSS文件
- 使用data-block-name选择器作用域样式
- 支持块特定的变体（如columns内的avatar覆盖）

### 装饰函数约定
- 函数名：`decorate` (default export)
- 参数：block (DOM Element)
- 职责：转换HTML结构，添加类名，处理交互
- 应用moveInstrumentation保留编辑器连接

## 11. xwalk架构细节

### resourceTypes层次
```
core/franklin/components/
├── block/v1/block           # 基础块（Avatar, Hero等）
├── block/v1/block/item      # 块项目（Card在Cards内）
├── columns/v1/columns       # 列容器（特殊布局块）
├── section/v1/section       # 部分容器
├── text/v1/text            # 基础文本组件
├── image/v1/image          # 基础图像组件
├── button/v1/button        # 按钮组件
└── title/v1/title          # 标题组件
```

### 模板vs模型
- **template** - 在xwalk中定义的初始默认值
- **model** - 引用component-models.json中的数据字段定义
- **filter** - 对于容器块（cards, columns），定义可包含的子项

## 12. Universal Editor集成点

### 编辑器识别
- `data-aue-type` - 编辑器中的内容类型
- `data-aue-*` - 编辑器元数据和路径
- `data-richtext-*` - 富文本编辑标记

### 编辑器行为
- 编者在Visual Editor中编辑块字段
- xwalk将更改序列化为HTML/markdown
- 内容保存到AEM
- 下次加载时, Franklin Delivery生成更新的HTML

