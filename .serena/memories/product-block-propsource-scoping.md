# propSource 作用域（已修复，指针）

**已修复并进入代码，机制说明已毕业到 CLAUDE.md。**

- 规则：见 `CLAUDE.md` →「Adding a product-series block (checklist)」末段
- 实现：`scripts/product-block-utils.js` 的 `propSource`（归属校验注释）

一句话：父模型缺某字段时，`propSource` 不得穿透到嵌套子 item 抢它的字段。
新增「父子模型字段名重叠」的 block 时验证这一点。

注意：同一修复另有一份在 `blocks/lixiang-product-intro-slider/slider-utils.js`
——该 block 自包含，共享文件的修复不会自动到达它。

相关：`mem:bug-fix-requires-env-verification`
