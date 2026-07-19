# Tasks: Refactor Localized Site Shell

> 本清单在提案获批后执行。任务顺序包含代码、Author、MSM 与发布 gate；任何后续阶段不得跳过前一阶段验收。

## 1. Baseline and safety

- [x] 1.1 导出并记录根级和 language-master 的 nav/footer JCR 路径、发布状态、`.plain.html` 与四断点截图。
- [x] 1.2 生成 header/footer/locale links 清单，标记根相对链接、AEM 引用、外部链接、404 和跨语言错误。
- [ ] 1.3 明确 migration fallback 的 owner、结束日期和退役条件。
- [ ] 1.4 为 resolver/parser 建立 fixture，覆盖当前 nav/footer 实际 delivery DOM。

## 2. Shared locale-root resolution

- [x] 2.1 新增无 DOM 依赖的 locale-root/path resolver 纯函数模块。
- [x] 2.2 实现 metadata override → localized sibling → migration root fallback 优先级。
- [x] 2.3 限制 override 为安全同源站内路径，拒绝危险 scheme 和歧义路径。
- [ ] 2.4 为母版、public、legacy、malformed、trailing slash 和 override 路径添加单元测试。
- [ ] 2.5 为 fragment candidate 加请求去重、可重试失败和一次性诊断 warning。
- [ ] 2.6 在 page model 增加可选 nav/footer/language/direction metadata fields，并验证 EDS 输出的 meta tags。

## 3. Locale directory authoring model

- [x] 3.1 新增单例 `header-settings` model，配置 localeDirectory 引用和全部本地化交互/accessible labels。
- [x] 3.2 新增 `locale-directory` container 与 `locale-option` item definitions/models/filter。
- [x] 3.3 配置 marketCode、marketLabel、languageTag、languageLabel、link、enabled、textDirection 字段与校验。
- [x] 3.4 确保模型为单层 container + flat items，不使用 nested multifield。
- [x] 3.5 生成语义化 anchors/list DOM；无效项跳过，不生成 `#`。
- [ ] 3.6 增加重复 key/link、同组 label 不一致、无 enabled items 的防御性校验。
- [x] 3.7 运行 `npm run build:json` 并检查生成文件只包含预期模型变化。

## 4. Header refactor

- [x] 4.1 使用 shared resolver 替换固定 `/nav` fallback，同时保留 metadata override 和迁移开关。
- [x] 4.2 移除 `LOCALE_MARKETS`、固定 dialog title 和所有业务目的地硬编码。
- [x] 4.3 从 `header-settings` 显式引用/当前 locale root 加载 locale directory，并复用同一数据生成桌面和移动视图。
- [x] 4.4 先校验 fragment 最小契约再增强 DOM；失败时保留真实语言入口链接。
- [ ] 4.5 从 `header-settings` 读取主导航、菜单、返回、语言与关闭 accessible labels；settings 无效时保留 semantic source nav。
- [x] 4.6 保持品牌、主导航、mega panel 与 cards 的现有语义兼容和 instrumentation。
- [x] 4.7 修复 link/current-state 规范化，不用 `#` 代替缺失 href。
- [ ] 4.8 验证 desktop panel、dialog、mobile drawer 的 keyboard/focus/ARIA/reduced-motion。

## 5. Footer refactor

- [x] 5.1 使用 shared resolver 替换固定 `/footer` fallback。
- [x] 5.2 保留 heading + list 列模型和现有简单 footer 兼容。
- [x] 5.3 将回到顶部 label/link 改为作者内容，JS 只做增强；缺失时不渲染。
- [x] 5.4 保持 desktop/mobile 双视图 instrumentation 和 accordion ARIA。
- [ ] 5.5 处理缺失 fragment、空列、长标签、RTL、legal/social 可选内容。

## 6. Document locale and links

- [x] 6.1 用 metadata/locale root 设置 `<html lang>`，移除固定 `en`。
- [ ] 6.2 在 eager 阶段按 metadata/BCP 47 技术规则设置 `<html dir>`，再与当前 locale option 的 textDirection 校验，覆盖 LTR 与 RTL。
- [x] 6.3 为 locale anchors 输出 `hreflang`，为当前项输出 `aria-current`。
- [x] 6.4 保持完整 SEO alternate/canonical 映射在本变更之外，并记录后续需求。

## 7. AEM authoring and MSM setup

- [ ] 7.1 在 `/language-master/en` 创建/完善 nav、footer、locale-directory 源内容；不修改旧 `/site/nav`。
- [x] 7.2 把母版 nav/footer 的根相对内部链接替换为语言根 AEM 内容引用。
- [ ] 7.3 为 `/language-master` 配置 blueprint 和标准 rollout governance。
- [ ] 7.4 创建 `/global/en` Live Copy，验证 nav/footer/locale-directory 均有 Live Relationship。
- [ ] 7.5 rollout 后验证内部链接重写、继承状态和经批准的 local overrides。
- [ ] 7.6 只将 Preview 目标完整的 locale option 设为 enabled。

## 8. Three-round validation

- [ ] 8.1 Round A：核对 AEM node、delivery path、`.plain.html`、resolver matrix 和 parser fixtures。
- [ ] 8.2 Round B：在 Universal Editor 验证增删排序、字段校验、instrumentation、Live Copy rollout/override。
- [ ] 8.3 Round C：在 390/1024/1440/1920 px 验证 LTR/RTL、长标签、键盘、焦点、0 console error、无横向溢出。
- [ ] 8.4 故障注入 nav/footer/directory 404、慢请求、空/重复/禁用 locale option，验证降级。
- [x] 8.5 运行 `npm run lint`、`npm run build:json`、resolver/parser tests 和浏览器 smoke tests。

## 9. Preview, live, and rollback

- [ ] 9.1 按 destination → locale-directory → nav/footer → pages 顺序发布到 Preview。
- [ ] 9.2 完成 `/global/en` canary 与 rollback rehearsal，确认 migration fallback 和小范围 page metadata override 可用；不假设 `/metadata.json` 已存在。
- [ ] 9.3 发布 Live 并观察 fragment 404、JS error、locale click 和性能指标一个完整周期。
- [ ] 9.4 对每个新增市场语言重复相同 gate，不批量启用未验收目标。

## 10. Legacy retirement and documentation

- [ ] 10.1 更新 header/footer 内容模型、作者手册、路径示例和发布运行手册。
- [ ] 10.2 查询并确认没有页面 metadata/代码引用根级 `/nav`、`/footer` 或 `/site/nav`。
- [ ] 10.3 移除 migration root fallback 并再次执行完整验证。
- [ ] 10.4 先取消旧根级 fragment 的 Preview/Live 交付，再按内容保留政策归档；不直接删除作为首次操作。
