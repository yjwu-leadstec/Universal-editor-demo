# About Us 页面对齐交付说明

> 适用页面：`/content/demo-site/language-master/en/about-us`(EDS Preview:`/language-master/en/about-us`)。
> 最终对齐基准：**现网** `https://www.liauto.com/about.html`（内容、图片、字体、断点、动效）;pencil 设计稿 `lixiang2/docs/pencil/about-us/about-us.pen` 为结构与移动布局参考。

## 区块与现网组件映射

页面共 9 个 block，自上而下：

| 顺序 | block | 现网组件（pmsData type) | 要点 |
| --- | --- | --- | --- |
| 1 | `lixiang-about-hero` | `product-loopvideo`(scene-first) | 100vh 全幅场景，文案 top 220px |
| 2 | `lixiang-about-vehicle-showcase` | `product-about-productlist` | 100vh，白字标题+副文案；现网无车型行 |
| 3 | `lixiang-about-video` | `product-loopvideo`(scene-movehome) | 标题 64px + Watch 链接 + 内联自动播放视频 |
| 4 | `lixiang-about-dual-panel` | title-link + `product-tech-detail-operating` | 双卡叠图白字 + 底部 footnote |
| 5 | `lixiang-about-dual-panel` | 同上（scene-adss) | 连续第二个实例 padding-top 收敛为 91px |
| 6 | `lixiang-about-design-language` | title-link + `product-about-cardcontent` | 大图（含 big 覆盖文案）+ 3 小卡 |
| 7 | `lixiang-about-creativity` | title-link + operating ×3(scene-value) | 4 张白面板卡（文字在上图在下）+ 价值观白面板+大图 |
| 8 | `lixiang-about-video` | `product-loopvideo`(scene-happyhome) | 同 3 |
| 9 | `lixiang-about-create-together` | title-link + `product-about-cardcontent` | 3 张叠图卡 + 底部 footnote |

现网尾部另有 3 个区块（分享标题、`product-tech-ota-cardlist`、`product-about-brandbook`）未复刻——无对应 block。

## 模型与序列化约定（重要）

- **xwalk `max-cells` 上限为 4 个字段组**。超限时用下划线前缀把字段并入同组：`values_title / values_description / values_image` 组名都是 `values`，只算 1 格。`*Alt` 字段在基础字段存在时自动折叠，不占格。
- **同组字段在发布 HTML 中会序列化成一个合并 cell**（段落 + 图片混排在一个 div 里）。JS 解析惯例见 `about-block-utils.js` 中 `lixiang-about-creativity` 的 `values` 组与 `lixiang-about-design-language` 的 `big` 组：先尝试 `propText/propPicture('values_title')`(UE 编辑器形态），取不到再解析 `propSource(block, 'values')` 合并 cell（发布形态）。
- **`name` 是保留属性**（块的显示名）。不要把模型字段命名为 `name`——Franklin 序列化会丢弃它。车系车型字段用 `modelName`。
- `scripts/about-block-utils.js` 的 `ABOUT_MODEL_FIELDS` 负责发布形态（无 `data-aue-prop`）下的**按位恢复**，字段顺序必须与 `modelFields` 输出一致；collection 行（`children.length > 1`）会被跳过并归入 `modelItems`。

## 图片：PC / Pad / Mobile 三档

- hero 与 vehicle-showcase 的模型字段：`image`(PC)、`image_pad`、`mobileImage`。`image` 与 `image_pad` 同属 image 组，发布时合并为一个 cell,JS 按 cell 内 picture 顺序取（0=PC,1=Pad)。
- 显隐档位：≥1025px PC、721–1024px Pad、≤720px Mobile，与现网一致。
- 显隐规则必须带 `.xxx-media` 父级前缀，否则权重输给通用 `.xxx-media picture { display:block }`。
- 现网图片资产已全部落在 `/content/dam/li-auto/shared/corporate/about-us/`（约 67 个，多为现网 lilibrary 同名 UUID 资产）；引用一律用标准 DAM 路径。

## 字体

- `fonts/` 内的 licium regular/medium 已替换为**现网原版完整文件**（各约 1.5MB，源自 `lilibrary-public.liauto.com`；旧 13KB 子集与现网渲染不同，勿回退）。
- 映射（`styles/styles.css` about 作用域）：标题（h1/h2/h3) = `licium-medium` fw400；正文/副标题/footnote = `licium-regular`；桌面端 operating caption(dual-panel/creativity/values 的描述） = `licium-medium`，移动端回落 regular。

## 断点：流式 --about-scale

现网不是定值断点，而是 rem 流式缩放。`styles/styles.css` 在 about section 上定义 `--about-scale`:

| 宽度 | scale | 现网 html font-size |
| --- | --- | --- |
| ≥1441px | 1 | 112px |
| 1025–1440px | 0.75 | 84px |
| 721–1024px | `calc(100vw / 1344px)` | vw/12 |
| ≤720px | 移动端定值（见各 block 移动档） | 60px |

桌面所有字号/位置/内边距/间距写作 `calc(npx * var(--about-scale, 1))`；内容容器为 `83.3333vw`、1600px 封顶（现网同）。特殊覆盖：721–850 hero 文案 top 189px、721–1024 车系标题 `calc(42px * scale)`、721–1024 双栏卡片高宽比 `790/713`。

hero / vehicle-showcase 场景高度 = `100vh` + `min-height: 56.25vw`（移动端 `100vh` + `min-height: 200vw`),`.adobe-ue-edit` 下有 `max-height: 1080px` 钳制，不会触发 UE 画布高度循环。

## 动效

- 文案条目（hero/车系/视频标题与链接）:`about-anim-item`,25px 上浮淡入，0.3s 起逐级 delay（现网 product-fadebox-item 同款）。
- 容器（卡片/媒体/头部）:`about-anim`,90px 上浮淡入，`cubic-bezier(.26,.67,.48,.91)`。
- 统一由 `about-block-utils.js` 的 `animateAboutBlock(block, { items, containers })` + 单个 IntersectionObserver 驱动，`prefers-reduced-motion` 下全部禁用。
- 视频 block：有 video URL 时内联 `<video autoplay muted loop playsinline>` 播放（poster = image 字段），底部 48px 播放/暂停圆形按钮；Watch 链接仍开 `<dialog>` 全屏播放。

## 内容与发布工作流

- 文字内容已与现网 pmsData 逐字对齐（2026-07-27 完成）；改文案以现网为准。
- 内容/资产激活：`POST /bin/replicate.json`,`cmd=Activate`,`agent=preview` 与 `agent=publish` 各一次（token 用 leadstec-dev Service Credentials 换 JWT)。
- 页面级 Activate 覆盖整个 block/item 子树；资源需单独激活。
- `media_xxx.jpg` 的 hash 按内容寻址：同内容资产 hash 相同，**不能用它判断是否部署了新图**，要以字节/像素比对为准。

## 环境注意

- leadstec-dev 共享 Sandbox 会把 `reference` 字段在 Author HTML 里改写为 `/adobe/dynamicmedia/deliver/dm-aid--...`(404)，导致 **UE Author 画布图片全裂**。这是环境级 DM 配置问题，需 AEM 管理员处理；Preview/Live 不受影响（`paths.json` 把 DAM 映射到 `/assets/`)。详见 `AGENTS.md`「DAM 与 Dynamic Media 强制边界」。
- UE Author 结构检查可用带 CDP 的 Chrome(`--remote-debugging-port` + 复制 profile 到独立 user-data-dir;Chrome 136+ 不允许对默认 profile 目录开 CDP)。
