# 铁律：bug 必须在环境上验证才算修完

**所有 bug 都必须部署到环境上、在环境上验证通过，才算"修完"。**

本地 `npm test` / lint / 用本地文件在浏览器里跑，**都不算测过**。
不要把本地结果报告为"已测试"或"已修复"。

## 为什么
用户明确指出：未经环境验证的结论都是猜测。本地与 AEM 实际运行环境存在差异——
编辑器插桩、CDN 缓存、分支代码版本、浏览器模块缓存，本地通过不代表线上正确。
（我曾把本地验证当"修完"汇报，被用户纠正。）

## 怎么做
1. 改完代码 → 提交 → **推送**
2. 等部署生效，在真实环境验证（AEM Universal Editor 画布 / 线上页面）
3. 只有环境上验证通过，才可以说"修复完成"
4. 未推送前如实说"改动在本地，尚未在环境验证"，不要说"已修复"

## 本项目的环境验证入口
- UE 画布（同源，可用）：
  `https://author-p80707-e1685574.adobeaemcloud.com/ui#/@leadstechltdptrsd/aem/universal-editor/canvas/author-p80707-e1685574.adobeaemcloud.com/content/demo-site/language-master/en/li-l6.html`
- `experience.adobe.com` 那个入口跨站 iframe 被拦，拿不到会话 cookie
- 用 web-access skill 的 CDP 连真实 Chrome（已设为默认浏览器）
- **注意开新 tab**——已有 UE tab 可能显示缓存的旧画面

相关：`mem:product-block-propsource-scoping`
