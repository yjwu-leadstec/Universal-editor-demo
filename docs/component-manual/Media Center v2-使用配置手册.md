# Media Center v2 使用、配置与发布手册

## 1. 适用范围

本手册用于独立的 Media Center v2 页面。它不修改旧的 `/media-center` 页面，也不使用旧页面中逐张录入卡片的方式。

v2 的唯一内容源是 `/media-library` 下的详情页。`media-center-feed` 在运行时读取 EDS 的 `query-index.json`，自动生成 Newsroom、Photos、Videos 三个列表。`helix-query.yaml` 必须保留对 Media Center 元数据的索引定义；页面虽然会输出这些 meta 字段，但不会自动进入 Query Index。

当前语言母版路径：

| 用途 | AEM Author 路径 | EDS 路径 |
| --- | --- | --- |
| Newsroom 列表 | `/content/demo-site/language-master/en/media-center-v2` | `/language-master/en/media-center-v2` |
| Photos 列表 | `/content/demo-site/language-master/en/media-center-v2/photos` | `/language-master/en/media-center-v2/photos` |
| Videos 列表 | `/content/demo-site/language-master/en/media-center-v2/videos` | `/language-master/en/media-center-v2/videos` |
| 详情记录根 | `/content/demo-site/language-master/en/media-library` | `/language-master/en/media-library` |

## 2. 工作原理

```text
详情页元数据
  -> EDS Query Index
  -> media-center-feed
  -> Newsroom / Photos / Videos 列表
```

列表不会保存或复制标题、日期、图片、链接。编辑详情页一次，所有匹配的列表会在发布并完成索引后自动更新。

渲染规则：

1. 仅显示 `visible=true` 且 `mediaType` 与当前列表一致的详情页。
2. 先按 `featured=true` 排序，再按 `sortOrder` 升序，最后按 `publishDate` 倒序。
3. `displayMode=grid` 为两列卡片；`displayMode=full-width` 在桌面端跨两列。
4. Photos 使用 `photoCount`，Videos 使用 `videoDuration` 作为卡片附加信息。
5. `publishDate` 在 Author 中使用 `YYYY-MM-DD`，列表 UI 使用英文长日期格式，例如 `June 29, 2026`。

## 3. 视觉与断点规则

Media Center v2 的列表样式需要对齐 Li Auto EN 现网页面，而不是旧 `/media-center` 的手工卡片样式。

| 断点 | 页面标题 | Tab | 列表布局 |
| --- | --- | --- | --- |
| `<1000px` | 不显示独立 H1，只保留移动 Header 后的列表 | 顶部横向 Tab，`64px` 高，文字 `16px`，当前项为黑色 | 单列卡片，左右约 `20px` 安全边距 |
| `1000px-1440px` | 居中 `Newsroom`，约 `48px / 67.5px` | Tab 居中，当前项黑色并有下划线 | 两列网格，卡片白底圆角，内容区左右约 `165px` |
| `1441px+` | 居中 `Newsroom`，约 `64px / 90px` | Tab 居中，当前项下划线为 `#dbad76`，宽约 `98px`，高 `2px` | 两列网格，内容区宽约 `1480px`，左右约 `220px` |

验收时必须特别看 `999px / 1000px` 和 `1440px / 1441px` 两组边界。卡片图片区不得遮挡 Tab，Tab 与第一行卡片之间必须保留现网间距。

## 4. Query Index 字段契约

`helix-query.yaml` 中的字段名与页面 meta 名称必须保持一致。改字段名时要同步修改 Author 模型、详情页属性、索引配置和 `media-center-feed` 读取逻辑。

| Query Index 字段 | 页面 meta 来源 | 用途 |
| --- | --- | --- |
| `title` | `og:title` | 卡片标题 |
| `description` | `description` | 详情摘要 |
| `mediaType` | `mediatype` | 分到 Newsroom、Photos、Videos |
| `visible` | `visible` | 控制是否进入列表 |
| `displayMode` | `displaymode` | 普通两列或桌面跨整行 |
| `featured` | `featured` | 精选排序 |
| `sortOrder` | `sortorder` | 人工排序 |
| `publishDate` | `publishdate` | 日期展示和排序 |
| `coverImage` | `coverimage` | 卡片封面 |
| `imageAlt` | `imagealt` | 图片替代文本 |
| `photoCount` | `photocount` | Photos 附加信息 |
| `videoDuration` | `videoduration` | Videos 附加信息 |

## 5. 一次性代码配置

代码只需在 `main` 合并一次：

1. 确认 `blocks/media-center-feed/`、`models/_page.json` 与根目录三个 `component-*.json` 都已提交。
2. 确认 `helix-query.yaml` 中已配置 `mediaType`、`visible`、`displayMode`、`featured`、`sortOrder`、`publishDate`、`coverImage` 等索引字段。
3. 推送 `main` 后等待 GitHub Build 成功。
4. 访问远程源码，确认 `media-center-feed.js` 包含 `query-index.json`：

   ```text
   https://main--universal-editor-demo--yjwu-leadstec.aem.page/blocks/media-center-feed/media-center-feed.js
   ```

5. Build 失败时不得继续发布内容；先修复并重新推送 `main`。

> 项目验收以远程 `main` 为准。仅本地 `aem up`、本地截图或未推送的代码不算完成。

## 6. 新建一条媒体详情记录

在对应的详情目录下新建普通 AEM 页面，而不是在列表页增加卡片：

| 类型 | 推荐目录 | 示例 slug |
| --- | --- | --- |
| Newsroom | `/media-library/news` | `kazakhstan-flagship` |
| Photos | `/media-library/photos` | `li-l6` |
| Videos | `/media-library/videos` | `l9-central-asia-launch` |

在页面 Properties 的 Media Entry 字段填写：

| 字段 | 必填 | 示例 / 规则 |
| --- | --- | --- |
| `jcr:title` | 是 | 卡片标题与详情页标题 |
| `jcr:description` | 建议 | 详情摘要与搜索摘要 |
| `mediaType` | 是 | `newsroom`、`photos` 或 `videos` |
| `visible` | 是 | `true` 显示，`false` 从所有 v2 列表隐藏 |
| `displayMode` | 是 | `grid` 或 `full-width` |
| `featured` | 建议 | `true` 会排在非精选记录之前 |
| `sortOrder` | 建议 | 数字越小越靠前，例如 `10`、`20`、`30` |
| `publishDate` | 是 | `YYYY-MM-DD`，例如 `2026-07-21` |
| `coverImage` | 是 | `/content/dam/li-auto/...` 的 DAM 图片 |
| `imageAlt` | 是 | 卡片封面替代文本 |
| `photoCount` | Photos | 相册图片数量，例如 `5` |
| `videoDuration` | Videos | 时长，例如 `01:52` |

禁止做法：

- 不要在 `media-center-feed` 下新建手工卡片行。
- 不要把图片写成 Dynamic Media、Scene7 或 UUID URL；只保存 `/content/dam/li-auto/...` 引用。
- 不要通过删除详情页隐藏内容；使用 `visible=false`，以保留可恢复的编辑记录。

## 7. 配置三个列表页

每个列表页只放一个 `Media Center Feed` block。字段如下：

| Block 字段 | Newsroom | Photos | Videos |
| --- | --- | --- | --- |
| `title` | `Newsroom` | `Photos` | `Videos` |
| `activeType` | `newsroom` | `photos` | `videos` |
| `sourcePath` | `/content/demo-site/language-master/en/media-library` | 同左 | 同左 |
| `routeBase` | `/content/demo-site/language-master/en/media-center-v2` | 同左 | 同左 |

`routeBase` 会自动产生 `/photos`、`/videos` Tab 链接；不要在每个页面重复维护三组卡片或三组 Tab 路径。

## 8. 发布顺序

代码和内容的发布分开处理。每一步均需在 AEM 或 GitHub 看到成功状态后再进行下一步。

1. **代码变更**：提交并推送 `main`，等待 GitHub Build 成功。没有远程 Build 成功，不进入验收。
2. **DAM 素材**：在 Assets 中 Quick Publish 本次新增或替换的 `coverImage`。素材必须位于 `/content/dam/li-auto`，其文件夹需保留 `cq:conf=/conf/demo-site`。
3. **详情记录**：发布本次新增或修改的详情页。只有首次创建 `/media-library`、`news`、`photos`、`videos` 目录，或目录发布状态缺失时，才需要补发布对应根目录和类型目录。
4. **列表页**：只有新增列表页、调整列表页 block 字段、修改路由或改页面结构时，才发布 `/media-center-v2`、`/media-center-v2/photos`、`/media-center-v2/videos`。普通新闻、图片、视频详情页的元数据更新不需要反复发布列表页。
5. **索引等待**：EDS Query Index 异步更新。列表短时间显示“等待发布”不等于配置丢失；等待索引后再验证。

在 AEM 页面编辑器中，可通过 **Page Information -> Publish Page** 发布当前页面；需要批量发布时使用 Sites 的 **Manage Publication**，只勾选本次 v2 路径与其引用素材。不得选择旧 `/media-center`。

## 9. 远程验收

发布后，强制刷新以下远程 Preview：

```text
https://main--universal-editor-demo--yjwu-leadstec.aem.page/language-master/en/media-center-v2
https://main--universal-editor-demo--yjwu-leadstec.aem.page/language-master/en/media-center-v2/photos
https://main--universal-editor-demo--yjwu-leadstec.aem.page/language-master/en/media-center-v2/videos
```

验收清单：

- GitHub Build 已成功，且远程 Preview 加载的是最新 `main`。
- `query-index.json` 中能查到已发布详情页，且包含正确的类型、日期、封面和可见性字段。
- Newsroom、Photos、Videos 各只显示自身类型。
- `visible=false` 的记录不显示。
- `full-width` 的记录在桌面端占满一行；移动端仍为单列卡片。
- 卡片日期按英文长日期显示，例如 `June 29, 2026`。
- 封面图片均由 `/assets/...` 成功加载，无 Dynamic Media URL、404、横向溢出或 `.block-error`。
- 在 `1920`、`1440`、`1441`、`1024`、`1000`、`999`、`768`、`390` 宽度验证；Author 画布还需验证约 `1006px`。
- 标题、Tab、卡片位置、字体大小、图片比例和卡片圆角需对齐现网；卡片图片区不得遮挡 Tab。
- GitHub Build、AEM Author、远程 Preview 三者均通过后，才视为完成。

## 10. 常见问题与回滚

| 现象 | 排查与处理 |
| --- | --- |
| 列表显示“等待发布” | 检查详情页是否已发布、详情页是否位于 `sourcePath` 下、等待 Query Index 更新后强刷 Preview。 |
| 卡片不显示 | 检查 `visible=true`、`mediaType` 是否匹配、`publishDate` 与封面字段是否已保存。 |
| 图片不显示 | 检查 `coverImage` 是否为 `/content/dam/li-auto/...`，并确认资产已 Quick Publish。 |
| 顺序不对 | 检查 `featured`、`sortOrder`、`publishDate`，优先级依次降低。 |
| 样式像旧页面 | 确认页面使用 `media-center-feed`，不是旧 `/media-center` 的手工卡片 block；再检查远程 Build 是否已成功。 |
| 需要暂时下线一条内容 | 设 `visible=false`，发布详情页；不要删除页面。 |

回滚遵循可恢复原则：先在 AEM 为详情页创建版本或恢复旧版本，再取消发布 v2 列表页或将记录设为 `visible=false`。代码回滚使用 `git revert` 生成新提交、推送 `main` 并等待新的 GitHub Build；不要使用强制推送或重写远程历史。
