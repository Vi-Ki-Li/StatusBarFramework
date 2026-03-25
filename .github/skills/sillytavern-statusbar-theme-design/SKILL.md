---
name: sillytavern-statusbar-theme-design
description:
  为酒馆状态栏设计可落地的主题方案（定义/样式/布局/主题组合/叙事/系统配置联动），并直接产出可导入JSON。只要用户提到“状态栏主题”“导入包”“模块
  JSON”“重构观感/层级”即应触发本 Skill，即使用户没有明确说“写 skill”或“写 schema”。
user-invocable: true
argument-hint: '[主题名] [信息密度: 低/中/高] [场景: 通用/战斗/日常/探索]'
---

# SillyTavern Statusbar Theme Design

用于把“看起来能用”升级到“读起来顺手、结构清晰、可批量复用”。

## 何时使用

- 需要为任意题材（奇幻/科幻/现代/校园等）输出一整套状态栏视觉方案。
- 需要把设计方案直接落地为可导入的模块 JSON。
- 用户只给设计目标，但要求你“直接给可导入 JSON，不要让我再读源码”。
- 现有状态栏存在：信息拥挤、主次不清、配色杂乱、组件质感弱、动效无反馈。

## 设计目标

1. 先读值：关键数值在 1 秒内可定位。
2. 再读组：模块分区清晰，分组关系自然。
3. 后读风格：配色、形状、材质、动效语义一致。
4. 可维护：按模块导入导出，便于迭代与迁移。

## 固定输出协议（默认）

当用户要“直接出可导入内容”时，默认输出以下内容：

1. 主题说明：信息架构 + 视觉语言 + 适用场景。
2. Definitions JSON（数据工作室）。
3. Styles JSON（样式工坊）。
4. Layouts JSON（布局编排器）。
5. Themes JSON（主题组合）。
6. Narratives JSON（叙事模板，可选但默认给）。
7. 若用户要整包迁移：额外给 Full Export JSON（系统配置-备份与迁移格式）。

除非用户明确说“只要某一个模块”，否则按 2-6 全给。

## 四层联动模型

1. 定义层（Data Studio）

- 给每个条目确定语义分组：世界上下文/角色身份/资源数值/状态开关。
- dataType 使用 text/number/boolean，避免对象直接上屏。

2. 样式层（Style Workshop）

- 为不同语义准备组件族：
  - 文本信息组件（标题 + 副标题）
  - 数值组件（大数字/进度条/对比值）
  - 布尔组件（开关态标签）
- 模板中遵循“标签小、值大、单位弱化”。

3. 布局层（Layout Composer）

- 常见布局顺序：
  - 首行：世界上下文/场景状态
  - 次行：角色身份 + 核心资源
  - 第三行：即时状态/临时效果
- 同一行最多 2-3 个视觉重点，避免整行都高对比。

4. 主题层（Theme Combo）

- 至少提供两套：总览版 + 紧凑版。
- 每套必须完整绑定：entryIds + styleOverrides + layoutId。

## 设计执行流程（建议）

1. 先定信息架构：列出必须看见的 6-12 个核心条目。
2. 再定视觉语言：确定颜色、圆角、阴影、描边、字重基线。
3. 再做组件映射：每个条目指定 style unit，避免一个样式包打天下。
4. 再搭布局：先低保真树结构，再补齐容器间距/对齐/比例。
5. 最后做主题组合：同一信息结构生成总览版和紧凑版。

## 执行顺序（强制，防止单元错位）

当任务包含“重构观感/层级/主题映射”时，必须按以下顺序执行并在每一步做快速自检，不可跳步：

1. Definitions（先数据语义）

- 先固定条目集合、分组、dataType、键路径。
- 禁止在主题映射阶段再新增或重命名 entryId。

1. Layouts（再空间骨架）

- 先搭容器层次和阅读顺序，再调 flex/grid 参数。
- 每个容器先确定“该层只承载哪一类阅读任务”。

1. Styles（后组件家族）

- 先定义样式单元家族（文本/数值/布尔/摘要），再写材质与动画。
- 同一容器优先复用同一类样式单元，避免混搭抢焦点。

1. Themes（最后映射绑定）

- 仅在 Definitions、Layouts、Styles 稳定后再写 styleOverrides + layoutId。
- 总览版与紧凑版应分别维护映射，不共用同一套覆盖关系。

1. Narratives + Validator（收尾）

- 叙事模板与文风提示最后补齐。
- 必跑校验：R001-R018 全通过后再交付。

常见失败模式（必须避免）：

- 先写 styleOverrides 再改布局层次，导致“同层单元错配”。
- 在布局阶段临时改 entryId，导致 theme/layout 跨引用失效。
- 紧凑版直接复用总览映射，只改布局不改单元语义，导致视觉冲突。

## UI 质量检查（发布前必过）

1. 配色一致性（针对“颜色杂”）

- 限制为 3 个主色 + 1 个强调色 + 中性色阶。
- 同语义颜色固定：告警、成功、信息态不能跨组件漂移。
- 文本与背景保证稳定对比，避免灰字叠灰底。

2. 形状与层级（针对“像素风 + 圆角风混搭”）

- 半径控制 2-3 个档位，不要每个组件一个值。
- 描边、阴影、字重采用统一刻度，避免“每块都像不同系统”。
- 标题、标签、数值建立固定字号比例。

3. 分组与容器（针对“内容在裸跑”）

- 同类信息放入同一容器壳层，容器要有背景或边界线。
- 组内留白小于组间留白，让眼睛先看到结构再看细节。
- 避免同层级既有大片空白又有局部拥挤。

4. 深度与材质（针对“纸片感/发灰”）

- 用 1-2 级阴影区分层级，不要全部平铺。
- 适度渐变/高光提升主组件识别度，避免高饱和硬拼色。
- 质感服务信息，不用复杂纹理抢视线。

5. 微交互反馈（针对“切换没反馈”）

- hover、active、selected 三态明确可见。
- 关键切换（主题应用、模块保存、开关）应有即时反馈。
- 动效时长和缓动统一，避免每处节奏不同。

6. 功能稳定性

- 主题保存后可立即应用并刷新。
- 刷新页面后主题配置不丢失。
- 导入导出 JSON 后可再次导入，无结构丢失。

## 框架能力附录（离开源码也能写 JSON）

### A. 模块总览（管理器）

1. 数据中心（Data Center）

- 作用：编辑聊天变量中的运行态数据（FrameworkState）。
- 特点：无独立“模块导入/导出按钮”；通常通过“原始数据”或“全量备份”处理。

2. 数据工作室（Data Studio）

- 导入导出：Definitions JSON。

3. 样式工坊（Style Workshop）

- 导入导出：Styles JSON。

4. 布局编排器（Layout Composer）

- 导入导出：Layouts JSON。

5. 系统配置（SystemConfig）

- 子能力：主题组合、叙事模板、原始数据、备份与迁移。
- 导入导出：Themes JSON、Narratives JSON、Full Export JSON。

### B. Layout Composer 支持能力

布局模式（LayoutMode）：

- flex-row
- flex-col
- grid
- absolute
- custom

容器常用字段：gap、padding、justifyContent、alignItems、width、height、gridCols、flexWrap、customCss。

### C. JSON 契约速查（字段级）

说明：下面是“可直接照抄”的字段级模板，满足本框架当前实现。

1. Data Center 运行态（FrameworkState，原始数据视图）

- 顶层字段：\_meta、\_characters、shared、characters、\_entry_meta。
- 最小模板：

```json
{
  "_meta": {
    "message_count": 0,
    "version": 1
  },
  "_characters": {
    "char_user": {
      "char_id": "char_user",
      "name": "用户",
      "isPresent": true
    }
  },
  "shared": {},
  "characters": {
    "char_user": {}
  },
  "_entry_meta": {
    "shared.示例键": {
      "source_id": 0,
      "user_modified": false
    }
  }
}
```

2. 数据工作室（Definitions）

- 文件顶层：version + categories + entries。
- category 字段：id、name、scope(shared|character)、order、icon?。
- entry 字段：
  - id、key、name、categoryId、icon
  - dataType(text|number|boolean)
  - validation(min|max|maxLength|pattern)
  - uiType
  - interactionType(none|click|toggle|input|custom)
  - description、updateSample、order
- 最小模板：

```json
{
  "version": 1,
  "categories": [
    {
      "id": "cat_demo",
      "name": "示例分类",
      "scope": "shared",
      "order": 0,
      "icon": "fa-solid fa-layer-group"
    }
  ],
  "entries": [
    {
      "id": "def_demo_hp",
      "key": "角色.气血",
      "name": "气血",
      "categoryId": "cat_demo",
      "icon": "fa-solid fa-heart-pulse",
      "dataType": "number",
      "validation": { "min": 0, "max": 100 },
      "uiType": "builtin-progress",
      "interactionType": "none",
      "description": "角色生命值",
      "updateSample": "[ { \"op\": \"replace\", \"path\": \"/characters/char_xxx/角色.气血\", \"value\": 80 } ]",
      "order": 0
    }
  ]
}
```

3. 样式工坊（Styles）

- 文件顶层：version + units + globalTheme(可选)。
- unit 字段：id、name、template、css、description、builtin、createdAt、updatedAt。
- globalTheme 字段：css、htmlTemplate。
- 最小模板：

```json
{
  "version": 1,
  "units": [
    {
      "id": "su_demo",
      "name": "示例样式",
      "template": "<div>{{name}}: {{value}}</div>",
      "css": ".demo{color:#fff}",
      "description": "",
      "builtin": false,
      "createdAt": 1700000000000,
      "updatedAt": 1700000000000
    }
  ],
  "globalTheme": {
    "css": "",
    "htmlTemplate": ""
  }
}
```

4. 布局编排器（Layouts）

- 文件顶层：version + layouts。
- layout 字段：id、name、root、createdAt、updatedAt。
- root/children 为 LayoutNode：
  - 通用：id、type(container|item)、label
  - 容器：layoutMode、children、gap、padding、gridCols、flexWrap、justifyContent、alignItems、width、height、customCss
  - 条目：definitionId、styleOverride
- 最小模板：

```json
{
  "version": 1,
  "layouts": [
    {
      "id": "layout_demo",
      "name": "示例布局",
      "createdAt": 1700000000000,
      "updatedAt": 1700000000000,
      "root": {
        "id": "ln_root",
        "type": "container",
        "label": "根容器",
        "layoutMode": "flex-col",
        "gap": "8px",
        "padding": "0",
        "children": [
          {
            "id": "ln_item_hp",
            "type": "item",
            "definitionId": "def_demo_hp",
            "label": "气血"
          }
        ]
      }
    }
  ]
}
```

5. 主题组合（Themes）

- 文件顶层：version + themes。
- theme 字段：id、name、description、entryIds、styleOverrides、layoutId、createdAt、updatedAt。
- 最小模板：

```json
{
  "version": 1,
  "themes": [
    {
      "id": "theme_demo",
      "name": "示例主题",
      "description": "",
      "entryIds": ["def_demo_hp"],
      "styleOverrides": {
        "def_demo_hp": "builtin-progress"
      },
      "layoutId": "layout_demo",
      "createdAt": 1700000000000,
      "updatedAt": 1700000000000
    }
  ]
}
```

6. 叙事模板（Narratives）

- 文件顶层：version + templates。
- template 字段：
  - id、name
  - sharedTemplate、characterTemplate、userTemplate、userModifiedTemplate、stylePrompt
  - createdAt、updatedAt
- 最小模板：

```json
{
  "version": 1,
  "templates": [
    {
      "id": "narr_demo",
      "name": "示例叙事",
      "sharedTemplate": "【世界】{{key}}: {{old_value}} -> {{new_value}}",
      "characterTemplate": "【{{char_name}}】{{key}}: {{old_value}} -> {{new_value}}",
      "userTemplate": "【{{user_name}}】{{key}}: {{old_value}} -> {{new_value}}",
      "userModifiedTemplate": "【用户修改】{{char_name}} 的 {{key}} 调整为 {{new_value}}",
      "stylePrompt": "",
      "createdAt": 1700000000000,
      "updatedAt": 1700000000000
    }
  ]
}
```

7. 系统配置原始数据（SystemConfig）

- 常用字段：
  - narrativeEnabled
  - narrativeInjectEnabled
  - narrativeKeepOnRollback
  - activeThemeId
  - patchHideRegexEnabled
- 最小模板：

```json
{
  "narrativeEnabled": false,
  "narrativeInjectEnabled": false,
  "narrativeKeepOnRollback": false,
  "activeThemeId": null,
  "patchHideRegexEnabled": true
}
```

8. 备份与迁移（Full Export）

- 文件顶层：\_omg_export + version + timestamp + 各模块对象。
- 可包含：definitions、styles、layouts、themes、narratives。
- 最小模板：

```json
{
  "_omg_export": true,
  "version": 1,
  "timestamp": 1700000000000,
  "definitions": {
    "version": 1,
    "categories": [],
    "entries": []
  },
  "styles": {
    "version": 1,
    "units": []
  },
  "layouts": {
    "version": 1,
    "layouts": []
  },
  "themes": {
    "version": 1,
    "themes": []
  },
  "narratives": {
    "version": 1,
    "templates": []
  }
}
```

### D. JSON 生成硬约束

1. 不省略 version 与关键顶层字段。
2. IDs 需保持稳定且语义清晰（cat*/def*/su*/layout*/theme*/narr* 前缀建议保持）。
3. themes.entryIds 必须与 definitions.entries.id 对齐。
4. themes.styleOverrides 的 key 必须在 entryIds 中，value 必须是样式单元 ID（内置或自定义）。
5. layouts 中 item.definitionId 必须存在于 definitions.entries.id。
6. Full Export 的子模块对象必须分别满足对应模块格式。
7. 若用户未要求时间戳，可用占位数值；若要求可追踪，使用一致的毫秒时间戳策略。

### E. 常见错误与修正示例（Bad/Good）

1. theme.entryIds 与 definitions.entries.id 不一致

Bad:

```json
{
  "entryIds": ["def_hp"],
  "styleOverrides": { "def_hp": "builtin-progress" }
}
```

```json
{
  "entries": [{ "id": "def_health", "key": "角色.气血" }]
}
```

Good:

```json
{
  "entries": [{ "id": "def_hp", "key": "角色.气血" }]
}
```

```json
{
  "entryIds": ["def_hp"],
  "styleOverrides": { "def_hp": "builtin-progress" }
}
```

2. layout.item.definitionId 指向不存在条目

Bad:

```json
{
  "root": {
    "id": "ln_root",
    "type": "container",
    "children": [{ "id": "ln_item_1", "type": "item", "definitionId": "def_missing" }]
  }
}
```

Good:

```json
{
  "entries": [{ "id": "def_hp", "key": "角色.气血" }]
}
```

```json
{
  "root": {
    "id": "ln_root",
    "type": "container",
    "children": [{ "id": "ln_item_1", "type": "item", "definitionId": "def_hp" }]
  }
}
```

3. styles.units 缺少导入必需字段

Bad:

```json
{
  "version": 1,
  "units": [{ "id": "su_demo", "name": "示例样式" }]
}
```

Good:

```json
{
  "version": 1,
  "units": [
    {
      "id": "su_demo",
      "name": "示例样式",
      "template": "<div>{{name}}: {{value}}</div>",
      "css": ".demo{color:#fff}",
      "description": "",
      "builtin": false,
      "createdAt": 1700000000000,
      "updatedAt": 1700000000000
    }
  ]
}
```

4. definitions.entry.dataType 与 validation 语义冲突

Bad:

```json
{
  "dataType": "text",
  "validation": { "min": 0, "max": 100 }
}
```

Good:

```json
{
  "dataType": "number",
  "validation": { "min": 0, "max": 100 }
}
```

或：

```json
{
  "dataType": "text",
  "validation": { "maxLength": 30, "pattern": "^[^\\n]+$" }
}
```

5. Full Export 缺少 `_omg_export` 标记

Bad:

```json
{
  "version": 1,
  "timestamp": 1700000000000,
  "definitions": { "version": 1, "categories": [], "entries": [] }
}
```

Good:

```json
{
  "_omg_export": true,
  "version": 1,
  "timestamp": 1700000000000,
  "definitions": { "version": 1, "categories": [], "entries": [] },
  "styles": { "version": 1, "units": [] },
  "layouts": { "version": 1, "layouts": [] },
  "themes": { "version": 1, "themes": [] },
  "narratives": { "version": 1, "templates": [] }
}
```

### F. 提交前自检清单（机器可执行版）

用途：在交付 JSON 前，按规则自动判定 PASS/FAIL，避免“能看不能导入”。

输入对象建议：

- definitionsJson
- stylesJson
- layoutsJson
- themesJson
- narrativesJson
- fullExportJson（可选）
- systemConfigJson（可选）

检查规则（建议实现为脚本规则表）：

1. R001_definitions_top_level

- 条件：definitionsJson.version 存在，且 categories/entries 为数组。

2. R002_definitions_entry_required_fields

- 条件：每个 entry 至少包含 id/key/name/categoryId/icon/dataType/validation/uiType/interactionType/order。

3. R003_styles_top_level

- 条件：stylesJson.version 存在，units 为数组。

4. R004_styles_unit_required_fields

- 条件：每个 unit 至少包含 id/name/template/css/description/builtin/createdAt/updatedAt。

5. R005_layouts_top_level

- 条件：layoutsJson.version 存在，layouts 为数组。

6. R006_layout_node_valid_type

- 条件：每个 layout node 的 type 只能是 container 或 item。

7. R007_layout_mode_valid

- 条件：container.layoutMode 只能是 flex-row/flex-col/grid/absolute/custom。

8. R008_themes_top_level

- 条件：themesJson.version 存在，themes 为数组。

9. R009_theme_required_fields

- 条件：每个 theme 至少包含 id/name/description/entryIds/styleOverrides/layoutId/createdAt/updatedAt。

10. R010_narratives_top_level

- 条件：narrativesJson.version 存在，templates 为数组。

11. R011_narrative_template_required_fields

- 条件：每个 template 至少包含 id/name/sharedTemplate/characterTemplate/userTemplate/userModifiedTemplate/stylePrompt/createdAt/updatedAt。

12. R012_crossref_theme_entry_exists

- 条件：theme.entryIds 中每个 id 都存在于 definitions.entries.id。

13. R013_crossref_theme_style_key_in_entryIds

- 条件：theme.styleOverrides 的每个 key 都必须在同一 theme.entryIds 中。

14. R014_crossref_layout_item_definition_exists

- 条件：所有 layout item.definitionId 都存在于 definitions.entries.id。

15. R015_system_config_keys_valid（可选）

- 条件：systemConfigJson 若存在，只包含或兼容 narrativeEnabled/narrativeInjectEnabled/narrativeKeepOnRollback/activeThemeId/patchHideRegexEnabled。

16. R016_full_export_marker（可选）

- 条件：fullExportJson 若存在，必须有 \_omg_export=true，且包含 version/timestamp。

17. R017_full_export_submodules_shape（可选）

- 条件：fullExportJson 的 definitions/styles/layouts/themes/narratives 子对象分别满足对应顶层结构。

18. R018_id_uniqueness

- 条件：definitions.entries.id、styles.units.id、layouts.layouts.id、themes.themes.id、narratives.templates.id 各自内部不重复。

建议输出报告格式：

```json
{
  "summary": {
    "total": 18,
    "passed": 18,
    "failed": 0
  },
  "checks": [
    {
      "ruleId": "R012_crossref_theme_entry_exists",
      "passed": true,
      "evidence": "theme_demo.entryIds 全部可在 definitions.entries 中找到"
    }
  ]
}
```

执行策略建议：

1. 先跑结构检查（R001-R011）。
2. 再跑跨引用检查（R012-R014）。
3. 最后跑可选包体检查（R015-R017）和唯一性检查（R018）。

提交门槛建议：

- failed > 0 则禁止标记“可导入交付”。
- 必须在交付说明中附 summary 与失败项 evidence。

### G. 最小测试夹具目录与命令速查

用途：给“快速自测”准备一套最小可运行输入，不依赖题材，不需要临时拼命令。

建议目录（已可直接使用）：

- docs/test-data/statusbar-fixtures-minimal/good/definitions.json
- docs/test-data/statusbar-fixtures-minimal/good/styles.json
- docs/test-data/statusbar-fixtures-minimal/good/layouts.json
- docs/test-data/statusbar-fixtures-minimal/good/themes.json
- docs/test-data/statusbar-fixtures-minimal/good/narratives.json
- docs/test-data/statusbar-fixtures-minimal/good/full-export.json
- docs/test-data/statusbar-fixtures-minimal/good/system-config.json
- docs/test-data/statusbar-fixtures-minimal/bad/full-export-missing-marker.json

命令速查：

1. 校验五模块（常用）

```bash
node util/validate-statusbar-json.mjs \
  --definitions docs/test-data/statusbar-fixtures-minimal/good/definitions.json \
  --styles docs/test-data/statusbar-fixtures-minimal/good/styles.json \
  --layouts docs/test-data/statusbar-fixtures-minimal/good/layouts.json \
  --themes docs/test-data/statusbar-fixtures-minimal/good/themes.json \
  --narratives docs/test-data/statusbar-fixtures-minimal/good/narratives.json
```

2. 校验 Full Export（含 system-config）

```bash
node util/validate-statusbar-json.mjs \
  --full-export docs/test-data/statusbar-fixtures-minimal/good/full-export.json \
  --system-config docs/test-data/statusbar-fixtures-minimal/good/system-config.json
```

3. 产出报告文件（用于提交记录）

```bash
node util/validate-statusbar-json.mjs \
  --definitions docs/test-data/statusbar-fixtures-minimal/good/definitions.json \
  --styles docs/test-data/statusbar-fixtures-minimal/good/styles.json \
  --layouts docs/test-data/statusbar-fixtures-minimal/good/layouts.json \
  --themes docs/test-data/statusbar-fixtures-minimal/good/themes.json \
  --narratives docs/test-data/statusbar-fixtures-minimal/good/narratives.json \
  --report docs/test-data/statusbar-fixtures-minimal/report-good.json
```

4. 运行故障样例（应失败，用于确认规则生效）

```bash
node util/validate-statusbar-json.mjs \
  --full-export docs/test-data/statusbar-fixtures-minimal/bad/full-export-missing-marker.json
```

说明：若返回码为 0，表示全部通过；返回码为 2，表示存在失败规则；返回码为 1，表示读取或参数错误。

### H. 复杂 RPG 数据落地（对象/数组如何处理）

结论先行：当前 Data Studio 的 entry.dataType 仅支持 text/number/boolean，不支持“对象”作为一条 entry 直接渲染。

推荐落地策略（按优先级）：

1. 扁平键建模（首选）

- 用分层 key 表示对象路径，如：
  - 技能.青竹剑法.等级
  - 技能.青竹剑法.熟练度
  - 技能.青竹剑法.词条.主词条
  - 技能.青竹剑法.词条.副词条.破绽打击
- 优点：可校验、可布局、可主题映射、可做跨引用检查。

2. 摘要字段 + 详情字段（常用组合）

- 摘要字段：number/text，直接上屏。
- 详情字段：text（JSON 字符串），用于保留对象细节（不直接当结构化 entry 渲染）。
- 示例 key：技能.青竹剑法.详情JSON。

3. Data Center 原始数据（高级）

- 在 FrameworkState 原始数据中保留复杂结构（对象/数组），但展示层仍建议拆成可读 entry。
- 原则：状态可复杂，展示要扁平。

建模建议：

- 数值字段统一单位（%/层/秒）。
- 词条命名保持稳定，不随文案改写频繁换 key。
- 对“可排序/可比较”信息优先 number，不要全部塞 text。

### I. SVG/动画能力边界（状态栏上限）

支持能力：

1. Style unit template 可写内联 SVG（icon、分割纹样、进度蒙版）。
2. style.css 与 globalTheme.css 可写 keyframes、transition、hover/active/selected。
3. 可通过容器边框、渐变、遮罩、伪元素（::before/::after）增强层次。

不建议或限制：

1. 不依赖脚本执行做动效逻辑（优先 CSS 动效）。
2. 避免高频重排动画（width/height/top/left）；优先 transform/opacity。
3. 避免持续大范围动画导致阅读干扰；常驻动效控制在 1-2 处。

动效参数建议：

- 微交互时长：150-250ms。
- 状态脉冲/漂浮：1.2-2.0s，低幅度。
- 必做可用性：保留无动效时的可读性（即使动画失效也能读值）。

补充命令：

1. 校验当前武侠整套文件

```bash
node util/validate-statusbar-json.mjs \
  --definitions docs/test-data/wuxia-rpg-imports/wuxia-data-studio.json \
  --styles docs/test-data/wuxia-rpg-imports/wuxia-style-workshop.json \
  --layouts docs/test-data/wuxia-rpg-imports/wuxia-layout-composer.json \
  --themes docs/test-data/wuxia-rpg-imports/wuxia-theme-combo.json \
  --narratives docs/test-data/wuxia-rpg-imports/wuxia-narrative-template.json
```

2. 输出武侠校验报告

```bash
node util/validate-statusbar-json.mjs \
  --definitions docs/test-data/wuxia-rpg-imports/wuxia-data-studio.json \
  --styles docs/test-data/wuxia-rpg-imports/wuxia-style-workshop.json \
  --layouts docs/test-data/wuxia-rpg-imports/wuxia-layout-composer.json \
  --themes docs/test-data/wuxia-rpg-imports/wuxia-theme-combo.json \
  --narratives docs/test-data/wuxia-rpg-imports/wuxia-narrative-template.json \
  --report docs/test-data/wuxia-rpg-imports/validation-report.json
```

## 推荐交付物（通用命名）

- <theme-name>-definitions.json
- <theme-name>-styles.json
- <theme-name>-layouts.json
- <theme-name>-themes.json
- <theme-name>-narratives.json
- <theme-name>-full-export.json（当用户要求一键迁移）
- <theme-name>-design-notes.md（主题意图 + 组件映射 + 适用场景）

## 输出要求（给代理的硬约束）

- 不使用题材绑定命名作为默认模板（如固定武侠命名）。
- 输出 JSON 时严格匹配对应模块顶层字段。
- 若用户说“全部模块 JSON”，必须覆盖 Data Center 运行态说明 + Definitions + Styles + Layouts + Themes + Narratives +
  SystemConfig/Full Export。
- 对每套主题给出“总览版/紧凑版”的差异说明。
- 最终交付前附上 UI 质量检查通过项列表。
