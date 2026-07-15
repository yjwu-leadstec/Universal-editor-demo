<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## AEM Author 内容路径

当前 EDS 项目的页面内容统一维护在以下 AEM Author 路径：

- Sites 控制台：[打开当前 EDS 内容目录](https://author-p80707-e1685574.adobeaemcloud.com/ui#/aem/sites.html/content/demo-site/language-master/en)
- JCR 内容根路径：`/content/demo-site/language-master/en`
- 环境：`author-p80707-e1685574.adobeaemcloud.com`

新增或更新英文页面内容时，默认使用该内容根路径，不得自行切换到其他站点、语言根或 AEM 环境。该路径属于可变的项目配置；只有用户明确提供更新后的路径时才修改本记录，并从新路径继续后续内容同步。
