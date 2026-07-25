# Media Center v2 使用、配置与发布手册

## 1. 内容来源与范围

Media Center v2 是独立页面，不修改旧 `/media-center`。Newsroom、Photos、Videos 不再逐张维护卡片，也不依赖 EDS Query Index；每条卡片由一个 AEM Content Fragment（CF）自动渲染。

| 用途 | AEM Author 路径 | EDS 路径 |
| --- | --- | --- |
| Newsroom | `/content/demo-site/language-master/en/media-center-v2` | `/language-master/en/media-center-v2` |
| Photos | `/content/demo-site/language-master/en/media-center-v2/photos` | `/language-master/en/media-center-v2/photos` |
| Videos | `/content/demo-site/language-master/en/media-center-v2/videos` | `/language-master/en/media-center-v2/videos` |
| CF 根目录 | `/content/dam/li-auto/media-center-v2` | 不直接访问 |

数据流为：

```text
Content Fragment 的 jsonEntry
  -> AEM Publish Persisted GraphQL Query（global/media-center-feed）
  -> media-center-feed block
  -> Newsroom / Photos / Videos 列表
```

## 2. CF 数据契约

在 CF 根目录中用 **Simple JSON Object** 模型创建记录，在 `jsonEntry` 填入 JSON 对象。每个列表页仅配置 CF 根目录；新增、隐藏、排序或整行展示均只改 CF，不改列表页。

| 字段 | 必填 | 规则 |
| --- | --- | --- |
| `mediaType` | 是 | `newsroom`、`photos`、`videos` |
| `title` | 是 | 卡片标题 |
| `publishDate` | 是 | `YYYY-MM-DD` |
| `coverImage` | 是 | `/content/dam/li-auto/...` 图片 |
| `imageAlt` | 是 | 封面替代文本 |
| `detailPath` | 是 | `/media-library/...` 的详情页路径；block 自动补当前站点根路径 |
| `visible` | 是 | `true` 显示，`false` 隐藏但保留记录 |
| `displayMode` | 是 | `grid` 或 `full-width`；后者在桌面端占满一行 |
| `featured` | 建议 | `true` 优先展示 |
| `sortOrder` | 建议 | 数字越小越靠前 |
| `photoCount` | Photos | 相册数量，例如 `5` |
| `videoDuration` | Videos | 时长，例如 `01:52` |

排序顺序：`featured=true` 优先，随后 `sortOrder` 升序、`publishDate` 降序。图片只能引用 `/content/dam/li-auto/...`，不得使用 Dynamic Media、Scene7 或 UUID URL。

## 3. 列表页配置

每个列表页只保留一个 `Media Center Feed` block：

| Block 字段 | Newsroom | Photos | Videos |
| --- | --- | --- | --- |
| `title` | `Newsroom` | `Photos` | `Videos` |
| `activeType` | `newsroom` | `photos` | `videos` |
| `sourcePath` | `/content/dam/li-auto/media-center-v2` | 同左 | 同左 |
| `routeBase` | `/content/demo-site/language-master/en/media-center-v2` | 同左 | 同左 |

`routeBase` 自动生成 `/photos`、`/videos` Tab。不要添加手工卡片行，也不要为三页重复维护内容。

## 4. 一次性 AEM GraphQL 配置

在 Global 配置中启用 **GraphQL Persisted Queries**，并发布下列配置：

1. Endpoint：`/content/cq:graphql/global/endpoint`
2. Persisted query：`/conf/global/settings/graphql/persistentQueries/media-center-feed`
3. Publish 查询地址：`https://publish-p80707-e1685574.adobeaemcloud.com/graphql/execute.json/global/media-center-feed`

查询必须返回 `simpleJsonObjectList.items` 的 `_path` 和 `jsonEntry`，并仅筛选 `/content/dam/li-auto/media-center-v2/` 下的 CF。若前端域名与 AEM Publish 域名不同，管理员还必须为该 Preview/Production 域配置允许的 CORS Origin；没有此响应头，浏览器会拦截列表请求。block 使用五分钟缓存窗口参数读取 Persisted Query，避免 Publish 默认两小时 CDN 缓存延迟 CF 的新增、隐藏和排序结果。

## 5. 发布顺序

1. 代码只从 `main` 合并并推送，等待 GitHub Build 成功。
2. 首次部署或查询变更时，发布 GraphQL endpoint 与 persisted query。
3. 在 Assets 中 Quick Publish 每条 CF 的 `coverImage`。
4. 发布新增或变更的 CF。
5. 发布其 `detailPath` 指向的详情页，确保卡片链接可打开。
6. 等待最多五分钟使 block 的查询缓存窗口更新，然后强刷远程页面，确认 GraphQL 返回内容且页面实际渲染。

普通内容更新无需重新发布列表页。只在列表页结构、block 字段或路由变化时发布列表页。

## 6. 远程验收

必须验证远程 `main`：

```text
https://main--universal-editor-demo--yjwu-leadstec.aem.page/language-master/en/media-center-v2
https://main--universal-editor-demo--yjwu-leadstec.aem.page/language-master/en/media-center-v2/photos
https://main--universal-editor-demo--yjwu-leadstec.aem.page/language-master/en/media-center-v2/videos
```

- GitHub Build 成功，且 AEM Publish GraphQL 返回已发布的 CF。
- Newsroom、Photos、Videos 各仅出现自身类型；`visible=false` 不出现。
- `full-width` 在桌面跨两列，移动端仍为单列；封面不遮挡 Tab。
- 在 `1920`、`1441`、`1440`、`1024`、`1000`、`999`、`768`、`390` 宽度确认字体、位置、图片比例、圆角和无横向溢出。
- 卡片链接包含当前站点根路径，封面正常加载，无 `.block-error`、404 或浏览器 CORS 错误。

本地 `aem up`、本地截图或未推送的提交均不属于完成。任务结束后关闭本次打开的测试页。

## 7. 常见问题与回滚

| 现象 | 处理 |
| --- | --- |
| 列表为空 | 检查 CF、endpoint、persisted query 是否都已发布，且 `visible=true`、`mediaType` 匹配。 |
| 浏览器请求被拦截 | 为 EDS Preview/Production 域添加 AEM Publish CORS Origin，再复测响应头。 |
| 图片不显示 | 确认 `coverImage` 是已 Quick Publish 的 `/content/dam/li-auto/...` 路径。 |
| 链接 404 | 发布 `detailPath` 对应详情页，并确认路径以 `/media-library/` 开始。 |
| 需要下线 | 将 `visible` 改为 `false` 并发布 CF；不要删除记录。 |

代码回滚使用 `git revert` 生成新提交并推送 `main`，不要强制推送或重写远程历史。
