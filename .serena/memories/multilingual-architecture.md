# 多语言架构决策（AEMaaCS Author + EDS）

> 环境：**leadstec-dev**｜内容源：**AEMaaCS Author（Universal Editor / crosswalk）**，非文档源
> 实现层：`Universal-editor-demo/`（基于 aem-boilerplate，共享一套代码）
> 讨论定稿日期：2026-07-13

## 一、核心决策

| 决策 | 结论 | 理由 |
| --- | --- | --- |
| 站点数 | **单个 aem.live 站点** | 中央统一管理，无需按市场独立发布/权限 |
| **repoless** | **不需要** ❌ | repoless 只在"多个独立 aem.live 站共用一套代码(MSM 多站)"时才必须；单站用不上 |
| URL 策略 | **统一子路径**（`/区域/语言`） | 单站天然子路径 |
| 内容结构 | `/区域/语言`（region/language，AEM 官方 MSM 标准） | — |
| 多语言机制 | **language-masters 母版 + MSM live copy + language copy 翻译** | AEM 经典打法 |
| 母版与全球站 | **保留 language-masters（源）与 global（公开站）两个独立** | 源与线上解耦 |

> 关键澄清：repoless / Config Service / MSM 是**三个不同概念**，常被混为一谈。"要不要 repoless" == "要不要多个独立交付站"。单站 => 不要。

## 二、内容树结构

```
/content/demo-site/
├── language-masters/        ← 【源，不发布】path mapping 的 includes 必须排除
│   ├── en                   ← 英文母版 = 事实源头（唯一手写英文处）
│   ├── de                   ← 从 en 用 language copy 翻译来
│   └── al ...               ← 其他语言母版（al 是"语言"不是区域）
│
├── global/en                ← 公开：全球英文站 = live copy ← language-masters/en
├── us/en                    ← 公开：美国站 = live copy ← language-masters/en
└── de/de                    ← 公开：德国站 = live copy ← language-masters/de
```

- `global` 不特殊，就是"区域名=global、语言=en"的一个 region，创建方式与其他 region 相同（live copy of `language-masters/en`），路径 `global/en`。保持 `/区域/语言` 统一格式，勿写成单层 `/global`。

## 三、language copy vs live copy（别搞反）

- **Language copy（翻译）**：母版层跨语言，`language-masters/en` → 翻出 `language-masters/de` 等其他语言母版。
- **Live copy（MSM 继承）**：交付层，语言母版 → 滚到 `/区域/语言`，可本地断继承覆盖。
- 流程：英文母版做完 →（language copy 翻译）各语言母版 →（live copy）滚到各区域。

## 四、header / footer

- nav/footer 是独立可编辑 AEM 页面（页面名 `nav`/`footer`），header/footer block 通过 XHR 取 `${navPath}.plain.html`，路径来自 `<meta name="nav">`，默认 `/nav`。
- 单站按语言区分：用 **bulk metadata** 按路径给 `nav`/`footer` 元数据，如 `/us/en/** → nav=/us/en/nav`。
- 这些 nav/footer 页面本身也随 live copy 从母版滚出，改母版可一键 rollout。

## 五、单站架构必守约束

1. **language-masters 不对外交付** → path mapping `includes` 排除 `language-masters/**`，否则母版被公网访问。
2. **单站 = 所有区域共享发布/缓存/权限/配置**。将来若某区域要独立发布节奏/权限/域名，才是拆多站 + repoless 的信号。
3. **工作流代价**：改英文改的是 `language-masters/en`（源）→ rollout 到 `global/en` 等；作者不能直接在 `global/en` 随手改（会与母版脱节/被覆盖）。这是"源与线上解耦"的必然成本。

## 六、待确认 / 下一步

- [ ] 最终**语言清单**（en/al/de…）与**区域清单**（global/us/…）
- [ ] 确认接受"改英文走 language-masters → rollout"工作流（否则改走 global 一身二职方案）
- [ ] 产出：path mapping 的 `includes/mappings` 写法 + 第一条 live copy 建法清单
- [ ] （若未来转多站）先决条件：Adobe 为 program 开启 repoless + 建 canonical 站(org/site = GitHub owner/repo)

## 七、权威来源

- Multi-site management with AEM authoring: https://www.aem.live/developer/repoless-multisite-manager
- Repoless overview: https://www.aem.live/docs/repoless
- Config service setup: https://www.aem.live/docs/config-service-setup
- Authoring with AEM Sites for EDS: https://www.aem.live/docs/aem-authoring
- 单站多语言博客: https://www.aem.live/blog/future-proof-multilingual-website-edge-ensemble
- Header & Footer how-to: https://experienceleague.adobe.com/en/docs/experience-manager-learn/sites/edge-delivery-services/developing/universal-editor/how-to/header-and-footer
