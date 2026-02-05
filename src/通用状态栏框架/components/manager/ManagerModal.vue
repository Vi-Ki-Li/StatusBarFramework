<script setup lang="ts">
/**
 * 管理器模态框 - 左侧导航布局版本
 *
 * 基于 AIStudioAPP 版 UI 参考的设计系统
 * 左侧图标导航栏 + 主内容区
 */
import { computed, ref } from 'vue';
import DefinitionStudio from './modules/DefinitionStudio.vue';

type ModuleKey = 'data' | 'definitions' | 'styles' | 'layout' | 'config';

const activeModule = ref<ModuleKey>('data');

const modules = [
  { key: 'data', name: '数据中心', icon: 'database', desc: '管理角色状态数据' },
  { key: 'definitions', name: '定义工坊', icon: 'box', desc: '定义数据结构与元数据' },
  { key: 'styles', name: '样式工坊', icon: 'paintbrush', desc: '创建可复用样式单元' },
  { key: 'layout', name: '布局编排', icon: 'layout', desc: '可视化设计状态栏布局' },
  { key: 'config', name: '系统配置', icon: 'settings', desc: '预设、快照与系统设置' },
] as const;

const currentModule = computed(() => modules.find(m => m.key === activeModule.value));

// SVG 图标路径 (Lucide Icons 风格)
const iconPaths: Record<string, string> = {
  // Database - 数据中心
  database:
    'M12 2C6.48 2 2 4.69 2 8v8c0 3.31 4.48 6 10 6s10-2.69 10-6V8c0-3.31-4.48-6-10-6zm0 2c4.42 0 8 1.79 8 4s-3.58 4-8 4-8-1.79-8-4 3.58-4 8-4zm8 12c0 2.21-3.58 4-8 4s-8-1.79-8-4v-2.18c1.86 1.38 4.78 2.18 8 2.18s6.14-.8 8-2.18V16z',
  // Box - 定义工坊
  box: 'M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.36.2-.74.18-1.14 0l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.36-.2.74-.18 1.14 0l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15 5.04 8 12 11.85 18.96 8 12 4.15z',
  // Paintbrush - 样式工坊
  paintbrush:
    'M20.71 4.63l-1.34-1.34c-.39-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41zM7 14a3 3 0 0 0-3 3c0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2a4 4 0 0 0 4-4 3 3 0 0 0-3-3z',
  // Layout - 布局编排
  layout:
    'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 7h4v4H7V7zm6 0h4v4h-4V7zM7 13h4v4H7v-4zm6 0h4v4h-4v-4z',
  // Settings - 系统配置
  settings:
    'M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
  // Close
  close: 'M18 6L6 18M6 6l12 12',
  // Save
  save: 'M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z',
};

function handleClose() {
  // 事件需要发送到主窗口（Vue 组件虽然挂载在主窗口 DOM，但脚本运行在 iframe 中）
  const targetDocument = (window.parent ?? window).document;
  const event = new CustomEvent('th:manager-close');
  targetDocument.documentElement.dispatchEvent(event);
}
</script>

<template>
  <div class="manager" @click.stop>
    <!-- 左侧图标导航栏 -->
    <nav class="manager__nav">
      <button
        v-for="mod in modules"
        :key="mod.key"
        type="button"
        class="manager__nav-item"
        :class="{ 'manager__nav-item--active': activeModule === mod.key }"
        :title="mod.name"
        @click="activeModule = mod.key"
      >
        <svg class="manager__nav-icon" viewBox="0 0 24 24" width="22" height="22">
          <path :d="iconPaths[mod.icon]" fill="currentColor" />
        </svg>
      </button>
    </nav>

    <!-- 主内容区 -->
    <div class="manager__main">
      <!-- 顶部标题栏 -->
      <header class="manager__header">
        <div class="manager__title-group">
          <h1 class="manager__title">{{ currentModule?.name }}</h1>
          <p class="manager__subtitle">{{ currentModule?.desc }}</p>
        </div>
        <div class="manager__actions">
          <button class="manager__btn manager__btn--primary" type="button">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path :d="iconPaths.save" fill="currentColor" />
            </svg>
            <span>保存</span>
          </button>
          <button class="manager__btn manager__btn--close" type="button" @click="handleClose">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path :d="iconPaths.close" />
            </svg>
          </button>
        </div>
      </header>

      <!-- 模块内容区 -->
      <main class="manager__content">
        <!-- 定义工坊 -->
        <DefinitionStudio v-if="activeModule === 'definitions'" />

        <!-- 占位符 (其他模块开发中) -->
        <div v-else class="manager__placeholder">
          <svg class="manager__placeholder-icon" viewBox="0 0 24 24" width="64" height="64">
            <path :d="iconPaths[currentModule?.icon || 'database']" fill="currentColor" />
          </svg>
          <h2>{{ currentModule?.name }}</h2>
          <p class="manager__placeholder-text">此模块正在开发中...</p>
          <p class="manager__placeholder-hint">框架已成功加载！后续将逐步完善各项功能</p>
        </div>
      </main>

      <!-- 底部状态栏 -->
      <footer class="manager__footer">
        <span>通用状态栏框架 v0.1.0</span>
        <span class="manager__footer-status">浅色模式 · 开发中</span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   左侧导航布局 - 基于 AIStudioAPP 版设计系统
   ============================================ */

.manager {
  /* CSS 变量 */
  --modal-bg: rgba(255, 255, 255, 0.98);
  --modal-border: rgba(0, 0, 0, 0.08);
  --modal-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);

  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;

  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --color-primary-subtle: rgba(99, 102, 241, 0.1);
  --color-accent: #8b5cf6;
  --color-success: #10b981;
  --color-danger: #ef4444;

  --surface-hover: rgba(0, 0, 0, 0.04);
  --surface-active: rgba(99, 102, 241, 0.12);

  --nav-width: 72px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* 布局 */
  width: 92vw;
  max-width: 1100px;
  height: 85vh;
  max-height: 750px;

  background: var(--modal-bg);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--modal-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--modal-shadow);

  display: flex;
  flex-direction: row;
  overflow: hidden;
  margin: auto;

  font-family:
    'Inter',
    'Outfit',
    system-ui,
    -apple-system,
    sans-serif;
}

/* ====== 左侧导航栏 ====== */
.manager__nav {
  width: var(--nav-width);
  min-width: var(--nav-width);
  background: rgba(0, 0, 0, 0.02);
  border-right: 1px solid var(--modal-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  gap: 12px;
  flex-shrink: 0;
}

.manager__nav-item {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.manager__nav-item:hover:not(.manager__nav-item--active) {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.manager__nav-item--active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: #fff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
  transform: translateY(-2px);
}

.manager__nav-item--active::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 15px;
  border: 2px solid var(--modal-bg);
  opacity: 0.4;
  z-index: -1;
}

.manager__nav-icon {
  flex-shrink: 0;
}

/* ====== 主内容区 ====== */
.manager__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

/* 顶部标题栏 */
.manager__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 28px;
  background: rgba(255, 255, 255, 0.6);
  border-bottom: 1px solid var(--modal-border);
  flex-shrink: 0;
}

.manager__title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.manager__title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.manager__subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-tertiary);
}

.manager__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 按钮 */
.manager__btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.manager__btn--primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: #fff;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.manager__btn--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
}

.manager__btn--close {
  width: 38px;
  height: 38px;
  padding: 0;
  background: var(--surface-hover);
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.manager__btn--close:hover {
  background: rgba(239, 68, 68, 0.12);
  color: var(--color-danger);
}

/* 内容区 */
.manager__content {
  flex: 1;
  overflow: auto;
  padding: 28px;
  background: linear-gradient(180deg, rgba(249, 250, 251, 0.5) 0%, rgba(255, 255, 255, 0) 100%);
}

.manager__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.manager__placeholder-icon {
  color: var(--color-primary);
  opacity: 0.5;
  margin-bottom: 20px;
}

.manager__placeholder h2 {
  margin: 0 0 10px;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
}

.manager__placeholder-text {
  margin: 0;
  color: var(--text-secondary);
  font-size: 15px;
}

.manager__placeholder-hint {
  margin: 14px 0 0;
  color: var(--color-success);
  font-size: 13px;
  font-weight: 500;
}

/* 底部状态栏 */
.manager__footer {
  display: flex;
  justify-content: space-between;
  padding: 14px 28px;
  background: rgba(249, 250, 251, 0.95);
  border-top: 1px solid var(--modal-border);
  font-size: 12px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.manager__footer-status {
  color: var(--color-primary);
  font-weight: 500;
}

/* 滚动条 */
.manager__content::-webkit-scrollbar {
  width: 6px;
}

.manager__content::-webkit-scrollbar-track {
  background: transparent;
}

.manager__content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 3px;
}

.manager__content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* 响应式：小屏幕改为底部导航 */
@media (max-width: 640px) {
  .manager {
    flex-direction: column-reverse;
    width: 98vw;
    height: 92vh;
  }

  .manager__nav {
    width: 100%;
    min-width: 100%;
    height: auto;
    flex-direction: row;
    justify-content: space-around;
    padding: 8px 12px;
    border-right: none;
    border-top: 1px solid var(--modal-border);
    gap: 0;
  }

  .manager__nav-item {
    width: 44px;
    height: 44px;
  }

  .manager__nav-item--active {
    transform: none;
  }

  .manager__header {
    padding: 16px 20px;
  }

  .manager__title {
    font-size: 1.2rem;
  }

  .manager__content {
    padding: 20px;
  }
}
</style>
