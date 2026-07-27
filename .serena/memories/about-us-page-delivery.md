# About Us 页面交付（2026-07-27 完成）

About Us 页（`/content/demo-site/language-master/en/about-us`）已按现网 `www.liauto.com/about.html` 全面对齐：7 个 `lixiang-about-*` block 重构样式、文案与图片逐字/逐图同步现网、流式断点（`--about-scale`)、现网原版 Licium 字体、滚动动效、视频内联自动播放、PC/Pad/Mobile 三档背景图。

**不要重新调研**——完整口径、模型约定（`values`/`big` 合并 cell、`modelName`、image 组三图）、断点表、字体映射、发布工作流都在 `docs/about-us-alignment.md`。

易踩的坑：
- xwalk 模型最多 4 个字段组，多字段用 `prefix_` 并组（见 AGENTS.md「模型字段强制约定」)。
- `name` 是保留属性，不能作模型字段名。
- leadstec-dev Sandbox 会把 reference 字段渲染成 `/adobe/dynamicmedia/...`(404),Author 画布烂图是环境问题，不要改代码或内容去适配。
- `media_*.jpg` hash 按内容寻址，不能用来判断图片是否已更新。
