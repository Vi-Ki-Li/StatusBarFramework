# Phase 8.5 武侠视觉重写与主题设计 Skill

## 需求

- 用户反馈当前状态栏“可用但不好看”，需要重写武侠主题测试数据。
- 要求每次改动同步记录 docs。
- 需要沉淀可复用方法，后续可以继续产出不同主题。

## 执行

1. 重写武侠测试数据核心视觉文件：

- `docs/test-data/wuxia-rpg-imports/wuxia-style-workshop.json`
- `docs/test-data/wuxia-rpg-imports/wuxia-layout-composer.json`
- `docs/test-data/wuxia-rpg-imports/wuxia-theme-combo.json`
- `docs/test-data/wuxia-rpg-imports/wuxia-narrative-template.json`

1. 新增视觉设计指南：

- `docs/STATUSBAR-VISUAL-DESIGN.md`

1. 新增可复用 Skill：

- `.github/skills/sillytavern-statusbar-theme-design/SKILL.md`

## 产出要点

- 视觉策略从“单组件好看”改为“阅读顺序优先”。
- 提供总览版 + 紧凑版两套主题组合，匹配剧情与战斗场景。
- 将主题设计经验固化为 Skill，减少后续重复沟通成本。

## 风险与后续

- 仍需在真实酒馆页面做桌面/移动双端截图回归，验证字号与间距在窄屏下的可读性。
- 后续可扩展同一 Skill 的题材参数（赛博、校园、克苏鲁等）。
