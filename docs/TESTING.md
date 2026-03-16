# 测试指南

> 每个 Phase 完成后的测试方法。你需要在 SillyTavern 中加载脚本才能测试。

## 环境准备

1. 在项目根目录运行 `pnpm watch` 启动 webpack 热重载
2. 在 SillyTavern 中导入实时脚本（地址类似 `import 'http://localhost:5500/copilot-worktree-xxx/dist/通用状态栏框架脚本/index.js'`）
3. 打开浏览器开发者工具 (F12) 查看控制台输出

## Phase 0: 基础设施

### 测试清单

- [ ] 控制台显示 `[通用状态栏框架] 初始化，实例: xxx`
- [ ] 控制台显示 `extensionsMenu 按钮已添加`
- [ ] 打开 SillyTavern 右侧扩展菜单，能看到"状态栏管理器"按钮
- [ ] 点击"状态栏管理器"按钮，弹出管理器浮窗
- [ ] 管理器左侧有 5 个导航标签（数据中心、数据工作室、样式工坊、布局编排器、系统配置）
- [ ] 点击右上角深浅色切换按钮，主题切换正常
- [ ] 点击管理器外部区域（遮罩），管理器关闭
- [ ] 按 `Ctrl+Alt+Shift+R` 触发安全模式，控制台有日志
- [ ] 重新加载脚本时，旧实例被清理、新实例正常接管

## Phase 1: 数据层核心

### 测试方法

Phase 1 是纯逻辑层，没有 UI。可以在浏览器控制台手动测试：

```js
// 在脚本 iframe 的控制台中执行（需要找到正确的 iframe 上下文）

// 测试聊天变量读写
const state = {
  _meta: { message_count: 1, version: 1 },
  _characters: {
    char_user: { char_id: 'char_user', name: '玩家', isPresent: true },
    char_npc1: { char_id: 'char_npc1', name: '少女A', isPresent: true }
  },
  shared: { 时间: '傍晚', 地点: '学院' },
  characters: {
    char_user: { 生命值: 100, 魔力: 50 },
    char_npc1: { 生命值: 80, 好感度: 30 }
  },
  _entry_meta: {}
};

// 写入聊天变量
insertOrAssignVariables({ _omg_state: state }, { type: 'chat' });
```

## Phase 2: 数据工作室

### 测试清单

- [ ] 打开管理器 → 点击"数据工作室"标签
- [ ] 点击分类栏右上角的"+"按钮，弹出"新建分类"对话框
- [ ] 填写分类名称（如"角色属性"），选择属性（共享/角色），点击保存
- [ ] 新分类出现在左侧列表中
- [ ] 点击分类，右侧显示该分类下的条目列表（初始为空）
- [ ] 点击"新建条目"按钮，条目列表中出现"新条目"
- [ ] 点击条目，下方展开编辑面板
- [ ] 修改 KEY（如"生命值"）、显示名称、图标、数据类型等字段
- [ ] 对数字类型，设置最小/最大值验证规则
- [ ] 点击"自动生成"按钮，JSON Patch 示例自动填充
- [ ] Zod 预览区域显示对应的验证代码
- [ ] 点击"保存条目"按钮，弹出成功提示
- [ ] 点击"导出"按钮，下载 JSON 文件
- [ ] 点击"导入"按钮，选择之前导出的文件，数据恢复
- [ ] 编辑分类：点击"编辑分类"按钮，修改名称后保存
- [ ] 删除分类：点击"删除分类"按钮，确认后分类被移除
- [ ] 删除条目：点击条目右侧删除按钮，确认后条目被移除
- [ ] （图标选择器）点击条目的图标输入框，弹出图标选择器浮窗，搜索并选择图标

### 世界书注入测试

- [ ] 创建分类和条目后，条目填写了 description 和 update_sample
- [ ] 点击"注入世界书"按钮
- [ ] 检查世界书中是否新建了名为 `OMG_StatusBar_Definitions` 的世界书
- [ ] 世界书中的条目内容包含 description 和 JSON Patch 示例

## Phase 3: 状态栏渲染引擎

### 测试方法

状态栏需要聊天变量中有数据才会显示。测试步骤：

1. **先在数据工作室创建定义**
   - 新建分类"角色属性"（属性=角色）
   - 添加条目：key=`生命值`, name=`生命值`, dataType=`number`, validation.max=`100`
   - 添加条目：key=`好感度`, name=`好感度`, dataType=`number`, validation.max=`100`
   - 新建分类"世界状态"（属性=共享）
   - 添加条目：key=`时间`, name=`当前时间`, dataType=`text`

2. **写入测试数据到聊天变量**（在浏览器控制台执行）

```js
// 需要在酒馆主页面的控制台执行，或在脚本 iframe 中执行
insertOrAssignVariables({
  _omg_state: {
    _meta: { message_count: 1, version: 1 },
    _characters: {
      char_user: { char_id: 'char_user', name: '玩家', isPresent: true },
      char_npc1: { char_id: 'char_npc1', name: '少女A', isPresent: true }
    },
    shared: { 时间: '傍晚' },
    characters: {
      char_user: { 生命值: 85, 好感度: 60 },
      char_npc1: { 生命值: 70, 好感度: 45 }
    },
    _entry_meta: {}
  }
}, { type: 'chat' });
```

3. **发送一条消息**（让 AI 回复），状态栏应在最后一条消息下方显示

### 测试清单

- [ ] 最后一条消息下方出现暗色玻璃拟态风格的状态栏
- [ ] 状态栏顶部显示角色切换标签栏（"玩家"和"少女A"）
- [ ] 默认显示第一个非用户角色的数据（少女A）
- [ ] 点击"玩家"标签，切换到玩家数据
- [ ] 分区（"角色属性"、"世界状态"）正确显示
- [ ] 数字类型条目显示进度条
- [ ] 文本类型条目显示为简单文本
- [ ] 点击分区标题，该分区折叠/展开
- [ ] 发送新消息后，状态栏自动刷新
- [ ] 未定义的数据条目归入"其他"分区

## 通用调试技巧

- **找不到 extensionsMenu 按钮**：检查 `#extensionsMenu` 元素是否存在，可能在不同酒馆版本中 ID 不同
- **管理器打不开**：查看控制台是否有 JS 错误
- **状态栏不显示**：确认聊天变量中有 `_omg_state` 数据（在控制台执行 `getVariables({type:'chat'})._omg_state`）
- **样式不生效**：检查酒馆页面 `<head>` 中是否有 `script_id` 属性的 `<div>` 包含脚本样式
