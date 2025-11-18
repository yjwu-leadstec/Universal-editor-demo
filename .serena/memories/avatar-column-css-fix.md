# Avatar in Columns CSS Fix

## Problem Analysis
当avatar block被放在column组件内部时，CSS样式失效的原因：

1. **CSS优先级冲突**：
   - Columns组件使用 `display: flex` 和 `flex: 1`
   - Avatar的居中样式被column的flex布局覆盖
   - Column内的div选择器影响了avatar的布局

2. **结构问题**：
   - Avatar在column中成为子元素，不再是独立的block
   - Columns的通用选择器 `.columns > div > div` 影响所有子元素

## Solution Implemented

### 1. 双模式设计
- **默认模式**：单个头像居中显示（原有功能）
- **Grid模式**：多个头像网格布局（新增功能）

### 2. CSS规则优化

```css
/* 默认：单个头像居中 */
.block.avatar {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Grid变体：多头像网格 */
.block.avatar.grid {
  display: grid !important; /* 覆盖columns的flex */
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}

/* 在columns中的特殊处理 */
.columns .block.avatar {
  width: 100%;
  margin: 0;
}
```

### 3. 响应式设计
- 桌面端：最多4列
- 平板：2-3列自适应
- 手机：单列显示

## Usage

### 独立使用
```html
<!-- 单个头像（默认） -->
<div class="block avatar">
  <!-- avatar content -->
</div>

<!-- 多个头像网格 -->
<div class="block avatar grid">
  <!-- multiple avatar containers -->
</div>
```

### 在Column中使用
```html
<div class="columns">
  <div>
    <div>
      <!-- Column 1 content -->
    </div>
    <div>
      <!-- Column 2 with avatar grid -->
      <div class="block avatar grid">
        <!-- multiple avatars -->
      </div>
    </div>
  </div>
</div>
```

## Key Points
- 使用 `!important` 确保grid布局覆盖column的flex
- 为column中的avatar添加专门的CSS规则
- 保持向后兼容性，不影响现有的单个头像显示