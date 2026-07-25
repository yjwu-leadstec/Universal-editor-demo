# lixiang-product-intro-slider 修复（2026-07-25，commit 46b4635）

## 最重要的一条：改了 component model 必须先推 main，author 才认

AEM author 通过 `fstab.yaml` 的 `franklin.delivery/.../main` 端点渲染，**它按已发布的
`component-models.json` 生成节点的 `modelFields` 属性**。本地改了 model 不推送，
无论怎么写 JCR，服务端都按旧模型覆写（表现为「属性写不进去」）。

诊断信号：
```bash
curl -s "https://main--<repo>--<owner>.aem.page/component-models.json" | \
  python3 -c "import json,sys; [print(f['component']) for m in json.load(sys.stdin) if m['id']=='<block>' for f in m['fields'] if f['name']=='classes']"
```
本地与线上不一致 → 先 commit + push，等 EDS 构建完（约 12s）再操作内容。
推送需 `gh auth switch --user yjwu-leadstec`，推完切回 `yunjun199321`。

## 三个已修的代码缺陷

### 1. `classes` 必须是 multiselect，不能是 select
全项目 17 个带 classes 的 block，16 个用 `multiselect`（值为数组），
唯独 slider 曾用 `select` 把「主题+间距」塞进一个带空格的字符串值 `"light space-large"`。
EDS 对单值做 slug 化 → `light-space-large` 单个未知 class → `.light` / `.space-*` 全不匹配
→ padding 归零。这就是「上下空白没了」的根因。

审计命令（找出所有字符串形态的 classes）：
```python
# 遍历 component-definition.json 的 template.classes，isinstance(c, list) 才正确
```
UI 形态：Background / Spacing 两个分组各单选，maxSize=2。**作者必须两组各选一个**，
只选 Spacing 会导致 `classes=["space-large"]` 缺主题。

### 2. registry 里的幻影字段导致发布态整体错位
`PRODUCT_MODEL_FIELDS['highlight-slide']` 里有 `metrics`，但模型中无此字段。
发布态按 registry 顺序逐格还原，多一格 → 其后全部错位一位：
`link` 读到 copyColor 的值、`copyColor` 读到 showNote 的值、`indicatorLabel` 越界丢失。
已删除该项 + JS 中对应死代码（propText 恒空，分支永不执行）。

**新增/删除标量字段前必做**：数发布 HTML 的 cell 数，与 registry 中「非 companion 字段」
数量对齐。companion = `*Alt` / `*LinkText` / `*LinkType`，它们不占 cell。

### 3. 轮播暂停按钮无开关
`.highlight-rotation-control`（轮播自动切换暂停）≠ `createMedia` 的视频播放按钮。
设计稿 `Li-L6.pen` 节点 `KGHw6` 要求「播放暂停按钮…需可配置」。
新增 `showRotationControl`，默认 false（对齐现网），保留显式暂停以满足 WCAG 2.2.2。

### 4. CSS 冗余覆盖
slider 自己在 `@media (width <= 720px)` 重复声明了一份 space-* （数值与全局 base 相同，
但断点 720 vs 全局 719，1px 重叠）。已删，spacing 统一由 `styles/product-blocks.css` 控制。

## MCP 写 JCR 的两个坑

1. **`aem_import_json` 会把属性名全部小写化** —— 写进去的是 `mobileimage`/`imagealt`/
   `shownote`/`copycolor`/`linktype`，AEM 要的是驼峰。批量建节点后必须核验大小写，
   或直接用 `aem_set_property`。
2. **手工建的节点缺 `modelfields`**（小写、无 `@type` 后缀）。正常节点同时有
   `modelFields`（带 @type）和 `modelfields`（纯字段名）两条，缺后者块渲染不出内容。

## 未解决：author 渲染缓存

JCR 数据全部正确后，`franklin.delivery` 仍返回陈旧 markup（改 title / 开关后输出零变化，
`showRotationControl` 整行缺失、20 条 stat 不输出、classes 仍被 slug 化）。
排除了本地因素：重启 `aem up` 无效（它只是 Express 代理，无缓存头）；
改 `cq:lastModified` 触发失效无效。**只能靠发布页面刷新**，需要 Adobe ID 交互式登录。

无头浏览器无法复用 Adobe 登录态：IMS 会话在 Keychain 和 auth.services.adobe.com 域下，
复制 Chrome profile 的 Cookies/Local Storage 不够（实测 headless + headed 均停在登录页）。

## 验证手法
本仓库没装 playwright。写独立 mjs 拷到 `/Users/yunjun/my-code/pdf-tools/` 跑完删除。
检查：三断点 class / paddingTop / paddingBottom 对称性、`.highlight-rotation-control` 数量、
`.highlight-metrics .highlight-stat` 数量、横向溢出、console error。

相关：`mem:project-overview`、`mem:service-blocks-publish-safe-fix`
