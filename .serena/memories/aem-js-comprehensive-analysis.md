# aem.js 完整分析报告

## 1. 核心目的和角色

### aem.js 是什么
aem.js 是 Adobe Experience Manager (AEM) Edge Delivery Services 项目的**核心基础库**，位于 `/scripts/aem.js`。它是一个约717行的JavaScript模块，为整个Franklin框架提供：

1. **Block系统的核心支持**
   - 块的发现、标记和装饰
   - 块的CSS和JavaScript动态加载
   - 块的生命周期管理

2. **性能监控和优化**
   - RUM (Real User Monitoring) 数据收集
   - 图片懒加载和优化
   - Eager vs Lazy加载策略

3. **DOM操作和装饰**
   - 文本节点包装
   - 按钮识别和装饰
   - 图标处理
   - 章节组织

4. **资源加载**
   - CSS文件动态加载
   - JavaScript模块动态导入
   - 脚本加载管理

5. **数据提取和配置**
   - 元数据读取
   - 块配置解析
   - 响应式图片创建

### 与AEM Edge Delivery Services的关系
- AEM Edge Delivery Services 使用 Franklin (前身为Project Franklin) 作为内容交付引擎
- aem.js 是 Franklin 框架的**基础运行时库**
- 提供了块系统的客户端实现

## 2. 导出函数清单

aem.js 导出共 18 个主要函数：

### 块相关函数 (6个)
| 函数名 | 行数 | 功能 |
|--------|------|------|
| `decorateBlocks` | 609-611 | 装饰所有块，标记为 initialized 状态 |
| `decorateBlock` | 589-603 | 装饰单个块，设置数据属性和类名 |
| `loadBlock` | 552-583 | 加载块的CSS和JS，执行装饰函数 |
| `buildBlock` | 522-546 | 从二维数组构建块DOM结构 |
| `loadHeader` | 618-623 | 创建并加载header块 |
| `loadFooter` | 630-635 | 创建并加载footer块 |

### 章节加载函数 (3个)
| 函数名 | 行数 | 功能 |
|--------|------|------|
| `loadSection` | 659-672 | 加载单个章节内的所有块 |
| `loadSections` | 679-688 | 加载所有章节 |
| `waitForFirstImage` | 641-652 | 等待第一张图片加载（LCP优化） |

### DOM装饰函数 (5个)
| 函数名 | 行数 | 功能 |
|--------|------|------|
| `decorateSections` | 479-515 | 装饰所有章节，添加metadata支持 |
| `decorateButtons` | 409-441 | 识别并装饰按钮（单链接段落） |
| `decorateIcons` | 468-473 | 装饰图标，加载SVG |
| `decorateIcon` | 449-461 | 装饰单个图标 |
| `decorateTemplateAndTheme` | 341-351 | 从元数据应用模板和主题类 |

### 资源加载函数 (3个)
| 函数名 | 行数 | 功能 |
|--------|------|------|
| `loadCSS` | 237-250 | 加载CSS文件，去重 |
| `loadScript` | 257-275 | 加载非模块JS文件 |
| `createOptimizedPicture` | 299-336 | 创建响应式图片元素 |

### 工具函数 (4个)
| 函数名 | 行数 | 功能 |
|--------|------|------|
| `getMetadata` | 283-289 | 读取meta标签内容 |
| `readBlockConfig` | 195-231 | 从块的行中提取配置 |
| `toClassName` | 170-178 | 字符串转类名（kebab-case） |
| `toCamelCase` | 185-187 | 类名转驼峰命名法 |

### 其他函数
| 函数名 | 行数 | 功能 |
|--------|------|------|
| `sampleRUM` | 14-127 | RUM监控数据收集 |
| `wrapTextNodes` | 357-403 | 包装文本节点到<p>标签 |
| `setup` | 132-153 | 初始化window.hlx对象 |

## 3. 块系统支持

### decorateBlocks 和 decorateBlock 的工作流程

```
decorateBlocks(main)
├─ 选择所有块: main.querySelectorAll('div.section > div > div')
└─ 对每个块调用 decorateBlock(block)
   ├─ 获取第一个类名作为块名: shortBlockName = block.classList[0]
   ├─ 添加 'block' 类
   ├─ 设置 data-block-name 属性 (如 'avatar', 'hero')
   ├─ 设置 data-block-status = 'initialized'
   ├─ 调用 wrapTextNodes(block) - 包装纯文本
   ├─ 添加 wrapper 类 (如 'avatar-wrapper')
   ├─ 添加 container 类到 section (如 'avatar-container')
   └─ 调用 decorateButtons(block) - 识别按钮
```

### loadBlock 的执行流程

```
loadBlock(block) 中的状态机:
├─ 初始状态: undefined
├─ 设置为 'loading'
├─ 加载 CSS: loadCSS(`/blocks/{blockName}/{blockName}.css`)
├─ 导入 JS 模块: import(`/blocks/{blockName}/{blockName}.js`)
├─ 执行装饰函数: mod.default(block) 
│  └─ 块文件导出的 decorate(block) 函数
├─ 设置为 'loaded'
└─ 最终状态: 'loaded'
```

### 块的状态跟踪

```
block.dataset.blockStatus 的值:
1. undefined        → 未初始化
2. 'initialized'    → decorateBlock 完成
3. 'loading'        → 正在加载CSS/JS
4. 'loaded'         → 完成装饰
```

## 4. DOM装饰函数详解

### decorateSections 的处理

```javascript
// 输入: div.section 直接的子div
// 处理: 将无className的div和有className的div分组
// 输出结构:
<div class="section">
  <div class="wrapper">           // 无className子项的包装器
    <!-- 默认内容 -->
  </div>
  <div class="block-wrapper">     // 有className子项（块）
    <!-- 块内容 -->
  </div>
</div>

// 还处理 section-metadata:
- 读取 section-metadata 的配置
- style 属性 → 转换为类名
- 其他属性 → 转换为 data- 属性
```

### decorateButtons 的识别规则

识别单链接段落为按钮:
```
规则1: <p> → <a> (单链接)
结果: a.button, p.button-container

规则2: <p> → <strong> → <a> (加粗单链接)
结果: a.button.primary, p.button-container

规则3: <p> → <em> → <a> (斜体单链接)
结果: a.button.secondary, p.button-container

规则4: <a> 包含 <img>
结果: 不装饰为按钮 (保持为图像链接)
```

### decorateIcons 的工作方式

```javascript
// 查找: span.icon (可以有多个icon-*)
// 处理:
span.icon.icon-github
└─ 提取iconName: 'github'
└─ 创建img: <img src="/icons/github.svg" loading="lazy">
└─ 添加到span中

// 使用codeBasePath的目的:
- 支持不同部署路径
- window.hlx.codeBasePath 在 setup() 中从 scripts.js src 提取
```

### wrapTextNodes 的规则

```javascript
有效的直接子元素（不需包装）:
- P, PRE, UL, OL
- PICTURE, TABLE
- H1-H6

需要包装的情况:
1. 纯文本内容 → <p>
2. PICTURE + 其他内容 → <p>包装其他内容

处理编辑器属性:
- 移动 data-aue-* 属性到 <p>
- 移动 data-richtext-* 属性到 <p>
- 保留 class 属性
```

## 5. 资源加载策略

### loadCSS 的去重机制

```javascript
// 检查: document.querySelector(`head > link[href="${href}"]`)
// 如果已存在 → 直接 resolve()
// 如果不存在 → 创建 <link> 并追加到 head
// 返回Promise，onload时resolve

优点:
- 避免重复加载同一CSS
- 支持多个块共享样式文件
```

### loadScript 的去重机制

```javascript
// 检查: document.querySelector(`head > script[src="${src}"]`)
// 相同的去重逻辑
// 支持自定义属性: attrs参数

用途示例:
- loadScript(src, { async: 'true', defer: 'defer' })
```

### createOptimizedPicture 的响应式处理

```javascript
function createOptimizedPicture(
  src,           // 图片URL
  alt,           // alt文本
  eager,         // 是否eager加载
  breakpoints = [
    { media: '(min-width: 600px)', width: '2000' },
    { width: '750' }
  ]
)

输出结构:
<picture>
  <!-- webp source for 600px+ -->
  <source media="(min-width: 600px)" 
          type="image/webp" 
          srcset="/path/to/img.jpg?width=2000&format=webply&optimize=medium">
  
  <!-- webp source for mobile -->
  <source type="image/webp" 
          srcset="/path/to/img.jpg?width=750&format=webply&optimize=medium">
  
  <!-- fallback for 600px+ -->
  <source media="(min-width: 600px)" 
          srcset="/path/to/img.jpg?width=2000&format=jpg&optimize=medium">
  
  <!-- fallback img -->
  <img loading="lazy" 
       src="/path/to/img.jpg?width=750&format=jpg&optimize=medium" 
       alt="...">
</picture>

特性:
1. webply format - 现代浏览器优化
2. optimize=medium - 对比度和压缩优化
3. 多个breakpoints支持多分辨率
4. 懒加载（除非eager=true）
```

## 6. 性能监控 - sampleRUM

### RUM 初始化流程

```javascript
sampleRUM() 
├─ 创建 window.hlx.rum 对象
├─ 确定采样权重 (weight)
│  ├─ rum=on → weight=1 (100% 采样)
│  ├─ SAMPLE_PAGEVIEWS_AT_RATE='high' → weight=10 (10% 采样)
│  ├─ SAMPLE_PAGEVIEWS_AT_RATE='low' → weight=1000 (0.1% 采样)
│  └─ 默认 → weight=100 (1% 采样)
├─ 生成随机ID
├─ 判断是否选中: Math.random() * weight < 1
└─ 如果选中, 初始化监控
```

### 错误捕获

```javascript
// 捕获同步错误
window.addEventListener('error', ({ error }) => {
  sampleRUM('error', dataFromErrorObj(error))
})

// 捕获未处理的Promise拒绝
window.addEventListener('unhandledrejection', ({ reason }) => {
  sampleRUM('error', {...})
})

// 提取错误信息格式:
{
  source: 'function@file.js:123:45',  // 错误位置
  target: 'Error message'             // 错误描述
}
```

### RUM数据发送

```javascript
sampleRUM.sendPing(checkpoint, time, pingData)
└─ 使用 navigator.sendBeacon() 发送
└─ 目标: https://rum.hlx.page/.rum/{weight}
└─ 数据格式:
   {
     weight: 100,
     id: 'a1b2',
     referer: 'https://...',
     checkpoint: 'largest-contentful-paint',
     t: 1234567,
     ...pingData
   }
```

## 7. 配置提取 - readBlockConfig

### 工作机制

```javascript
readBlockConfig(block) 处理块内的配置行

输入结构 (块配置行):
<div class="config">
  <div>Property Name</div>
  <div>Property Value</div>
</div>

处理逻辑:
1. 选择块内所有 :scope > div 行
2. 对每行:
   - cols[0].textContent → 转换为属性名
   - toClassName() → kebab-case
   - cols[1] 内容 → 属性值

值提取优先级:
1. <a> 标签 → href（支持多个链接数组）
2. <img> 标签 → src（支持多个图片数组）
3. <p> 标签 → textContent（支持多个段落数组）
4. 其他 → textContent

输出: 对象
{
  propertyName: 'value',
  anotherProperty: ['url1', 'url2'],
  ...
}
```

### 使用示例

在 decorateSections 中:
```javascript
const sectionMeta = section.querySelector('div.section-metadata');
if (sectionMeta) {
  const meta = readBlockConfig(sectionMeta);  // 读取配置
  Object.keys(meta).forEach((key) => {
    if (key === 'style') {
      // style属性特殊处理 → 转为类名
      const styles = meta.style.split(',').map(s => toClassName(s.trim()));
      styles.forEach(s => section.classList.add(s));
    } else {
      // 其他属性 → data- 属性
      section.dataset[toCamelCase(key)] = meta[key];
    }
  });
  sectionMeta.parentNode.remove();  // 删除metadata元素
}
```

## 8. 元数据提取 - getMetadata

### 功能

```javascript
function getMetadata(name, doc = document)

处理两种meta标签:
1. <meta name="author" content="John">
   → getMetadata('author')

2. <meta property="og:title" content="Title">
   → getMetadata('og:title')

逻辑:
- 如果name包含':', 使用property属性查找
- 否则使用name属性查找
- 找到所有匹配的meta标签
- 提取content值，用', '连接多个值
- 返回字符串（默认''）
```

### 使用场景

在 aem.js 中:
```javascript
decorateTemplateAndTheme() {
  const template = getMetadata('template');  // <meta name="template">
  if (template) addClasses(document.body, template);  // 应用模板类
  
  const theme = getMetadata('theme');        // <meta name="theme">
  if (theme) addClasses(document.body, theme);  // 应用主题类
}
```

## 9. 页面加载生命周期

### aem.js 的初始化

```javascript
// aem.js最后执行:
init()  // 第690行
├─ setup()
│  └─ 初始化 window.hlx 对象
│     ├─ hlx.RUM_MASK_URL = 'full'
│     ├─ hlx.RUM_MANUAL_ENHANCE = true
│     ├─ hlx.codeBasePath = '' (从scripts.js src提取)
│     └─ hlx.lighthouse = false/true
└─ sampleRUM('top') 发送初始ping
```

### scripts.js 的调用链

```javascript
// scripts.js 导入自 aem.js:
import {
  loadHeader, loadFooter,
  decorateButtons, decorateIcons, decorateSections, decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection, loadSections,
  loadCSS,
} from './aem.js'

// 页面加载流程:
loadPage()
├─ loadEager(document)
│  ├─ decorateTemplateAndTheme()  // 应用模板/主题
│  ├─ decorateMain(main)
│  │  ├─ decorateButtons(main)
│  │  ├─ decorateIcons(main)
│  │  ├─ buildAutoBlocks(main)
│  │  ├─ decorateSections(main)
│  │  └─ decorateBlocks(main)     // 初始化所有块
│  ├─ document.body.classList.add('appear')
│  └─ loadSection(firstSection, waitForFirstImage)  // 加载第一个section
│
├─ loadLazy(document)
│  ├─ loadSections(main)          // 加载其他sections
│  ├─ 处理hash导航
│  ├─ loadHeader()
│  ├─ loadFooter()
│  └─ loadCSS('lazy-styles.css')
│
└─ loadDelayed()
   └─ 延迟3秒后 import('delayed.js')
```

### section 加载流程

```javascript
loadSection(section, loadCallback)
├─ 检查 section.dataset.sectionStatus
│  ├─ undefined / 'initialized' → 继续
│  └─ 'loading' / 'loaded' → 跳过
├─ 设置为 'loading'
├─ 获取所有块: section.querySelectorAll('div.block')
├─ 对每个块顺序调用 loadBlock(block)
│  ├─ 加载CSS
│  ├─ 动态导入JS
│  └─ 执行default导出函数
├─ 如果有loadCallback，执行它
├─ 设置为 'loaded'
├─ section.style.display = null  // 显示section
└─ 返回Promise
```

## 10. 块文件的整合

### 块文件导入 aem.js 的示例

**cards.js 示例:**
```javascript
import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  // block是从loadBlock传入的DOM元素
  // 这里可以使用aem.js导出的函数
  
  // 使用 createOptimizedPicture:
  [...li.children].forEach((div) => {
    div.querySelectorAll('picture > img').forEach((img) => {
      const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      img.closest('picture').replaceWith(optimizedPic);
    });
  });
}
```

**fragment.js 示例:**
```javascript
import { decorateMain } from '../../scripts/scripts.js';
import { loadSections } from '../../scripts/aem.js';

export async function loadFragment(path) {
  // 获取片段HTML
  const resp = await fetch(`${path}.plain.html`);
  const main = document.createElement('main');
  main.innerHTML = await resp.text();
  
  // 使用aem.js函数装饰和加载
  decorateMain(main);          // scripts.js导出，但用到aem.js
  await loadSections(main);    // 来自aem.js
}
```

## 11. window.hlx 全局对象

### 结构

```javascript
window.hlx = {
  // 配置
  RUM_MASK_URL: 'full',
  RUM_MANUAL_ENHANCE: true,
  codeBasePath: '/path/to/scripts',  // 项目根路径
  lighthouse: false,
  
  // RUM监控
  rum: {
    weight: 100,
    id: 'a1b2',
    isSelected: true/false,
    firstReadTime: 1234567890,
    queue: [],
    collector: function(...) {},
    sendPing: function(...) {},
    enhance: function() {}
  }
}
```

### codeBasePath 的确定

```javascript
setup() 中:
const scriptEl = document.querySelector('script[src$="/scripts/scripts.js"]');
if (scriptEl) {
  const scriptURL = new URL(scriptEl.src, window.location);
  if (scriptURL.host === window.location.host) {
    // 同主机: /my-app/scripts/scripts.js → /my-app
    [window.hlx.codeBasePath] = scriptURL.pathname.split('/scripts/scripts.js');
  } else {
    // 不同主机: 保留完整URL
    [window.hlx.codeBasePath] = scriptURL.href.split('/scripts/scripts.js');
  }
}
```

## 12. 集成点总结

### aem.js 与其他模块的关系

```
aem.js (基础库)
├─ 导出给 scripts.js
│  ├─ decorateTemplateAndTheme
│  ├─ decorateMain (via scripts.js)
│  ├─ loadEager (via scripts.js)
│  ├─ loadSection / loadSections
│  └─ 其他decoration函数
│
├─ 导出给 blocks/*/块文件
│  ├─ createOptimizedPicture (cards, hero等)
│  ├─ getMetadata (footer, header)
│  ├─ loadSections (fragment)
│  └─ 其他工具函数
│
└─ 导出给 scripts.js (进而传给blocks)
   └─ moveInstrumentation (via scripts.js导出)
```

### 关键设计模式

1. **状态机模式** - 块的 blockStatus 状态跟踪
2. **去重模式** - loadCSS, loadScript 防止重复加载
3. **Promise链** - 异步加载顺序控制
4. **配置提取模式** - readBlockConfig 的灵活提取
5. **装饰器模式** - decorate* 函数的组合
6. **采样模式** - sampleRUM 的条件采样

## 13. 高级功能

### waitForFirstImage 的 LCP 优化

```javascript
async function waitForFirstImage(section) {
  const lcpCandidate = section.querySelector('img');
  await new Promise((resolve) => {
    if (lcpCandidate && !lcpCandidate.complete) {
      // 强制eager加载
      lcpCandidate.setAttribute('loading', 'eager');
      // 等待加载完成
      lcpCandidate.addEventListener('load', resolve);
      lcpCandidate.addEventListener('error', resolve);
    } else {
      // 已加载或不存在 → 立即resolve
      resolve();
    }
  });
}

用途:
- 在 loadSection(firstSection, waitForFirstImage) 中使用
- 确保首屏的最大内容绘制(LCP)不被延迟
```

### sampleRUM.enhance() 的RUM增强器

```javascript
sampleRUM.enhance() {
  // 仅加载一次
  if (document.querySelector('script[src*="rum-enhancer"]')) return;
  
  // 获取增强器版本
  const { enhancerVersion, enhancerHash } = sampleRUM.enhancerContext || {};
  
  // 创建脚本标签
  const script = document.createElement('script');
  if (enhancerHash) {
    script.integrity = enhancerHash;  // SRI完整性检查
    script.setAttribute('crossorigin', 'anonymous');
  }
  
  // 从CDN加载
  script.src = `https://rum.hlx.page/.rum/@adobe/helix-rum-enhancer@^2/src/index.js`;
  document.head.appendChild(script);
}

目的:
- 加载Adobe的RUM增强库
- 提供额外的性能指标收集
- 支持SRI(Subresource Integrity)验证
```

## 14. 关键特性总结

### 性能特性
1. **Lazy loading** - 块和资源按需加载
2. **CSS/JS去重** - 避免重复加载
3. **响应式图片** - createOptimizedPicture 处理多分辨率
4. **LCP优化** - waitForFirstImage 确保首屏性能
5. **采样监控** - sampleRUM 低成本采样

### 编辑器集成特性
1. **编辑器属性保留** - 通过scripts.js的moveInstrumentation
2. **元数据支持** - section-metadata 配置
3. **块配置提取** - readBlockConfig 灵活的配置系统

### 可扩展性
1. **块系统支持** - 标准化的块生命周期
2. **动态导入** - 支持新块无需修改框架
3. **主题/模板系统** - decorateTemplateAndTheme

