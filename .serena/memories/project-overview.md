# Universal-editor-demo 项目概览

## 是什么
理想汽车 (Li Auto) Global English 官网 **www.liauto.com 的 AEM EDS 迁移项目**的**实现层**——可部署的 Edge Delivery Services 项目，用 Universal Editor 做可视化编辑。是工作区 `lixiang/code/` 下两个独立 git 仓库之一（另一个 `lixiang2/` 是只读参考层，本仓库不管它）。

**事实来源优先级（用户确认）**：现网 www.liauto.com > 设计稿 `.pen` > 旧 md 文档。与前两者冲突时可无视旧文档。

## 技术栈
AEM Edge Delivery Services (Franklin) + Universal Editor + 原生 ES6 JS/CSS3（lit-html 仅作轻量模板，非框架）。无单测框架，靠本地 preview / `aem up` + 截图人工验证。

## 结构
```
/blocks/<name>/    54 个 block：<name>.js（decorate）+ .css + _<name>.json（UE 模型）
/scripts/          核心工具：aem.js, scripts.js, product-block-utils.js, service-block-utils.js
/styles/           全局样式
/models/           _*.json → npm run build:json 合并成根 component-*.json
/docs/             组件手册、内容模型、各页分析（53M，含 assets）
```
Block 按页面族分组：`home-*`（首页）、`product-*`/`spec-table`/`lixiang-product-*`（车型页）、`service-*`（服务/Contact Us）、`media-*`（媒体中心）、`support-*`（**空壳目录，无 js，勿当功能块**）。

## 关键命令
```bash
aem up                 # 本地开发 localhost:3000（代理 author 内容 + 跑本地 block 代码）
npm run lint           # ESLint(airbnb-base + xwalk) + Stylelint，提交前必跑
npm run build:json     # 合并 models/_*.json → 根 component-*.json（husky pre-commit 自动）
```

## 环境与部署
- AEM author：`author-p80707-e1685574.adobeaemcloud.com`，内容在 `/content/demo-site/`；AEM MCP profile **`leadstec-dev`** 可直连查页面/JCR。
- EDS 交付：`https://<branch>--Universal-editor-demo--yjwu-leadstec.aem.page|.aem.live/<path>`（分支名**不能带斜杠**，否则预览 URL 无效）。
- Git：remote `yjwu-leadstec/Universal-editor-demo`。**本地 git 用户 `yunjun199321` 无写权限**；推送需 `gh auth switch --user yjwu-leadstec`（keyring 里已登录），推完切回。

## ⚠️ 核心开发约束
- 每个 block 的 `decorate()` **必须用 `moveInstrumentation()`** 迁移 `data-aue-*`，否则 UE 可视化编辑失效。
- **必须在发布态验证**（`.aem.live` 或 `aem up`，二者都没有 `data-aue-*`），不能只看 UE 编辑器态——大量 bug 只在发布态暴露。详见 `mem:service-blocks-publish-safe-fix`。
- 三断点验收：桌面 1440/1920、中屏 1024、移动 390；要求无横向溢出、0 console error。

相关：`mem:service-blocks-publish-safe-fix`（发布态修法）、`mem:home-blocks-development`（首页块+EDS交付结构坑）、`mem:avatar-block`。
