<template>
  <div ref="managerRootRef" class="omg-root" :data-omg-theme="theme">
    <div class="omg-manager-overlay">
      <div class="omg-manager">
        <!-- 头部 -->
        <header class="omg-manager__header">
          <h1 class="omg-manager__title">
            <i class="omg-manager__title-icon fa-solid fa-table-columns"></i>
            状态栏管理器
          </h1>
          <div class="omg-manager__actions">
            <button
              class="omg-theme-toggle"
              :title="theme === 'dark' ? '切换到浅色' : '切换到深色'"
              @click="toggleTheme"
            >
              <i :class="theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'" />
            </button>
            <button class="omg-manager__close" title="关闭" @click="$emit('close')">
              <i class="fa-solid fa-xmark" />
            </button>
          </div>
        </header>

        <!-- 主体：左侧导航 + 右侧内容 -->
        <div class="omg-manager__main">
          <!-- 左侧导航 -->
          <nav class="omg-manager__sidebar">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="omg-manager__sidebar-item"
              :class="{ 'omg-manager__sidebar-item--active': activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              <i :class="tab.icon" class="omg-manager__sidebar-icon" />
              <span class="omg-manager__sidebar-label">{{ tab.label }}</span>
            </button>
          </nav>

          <!-- 右侧内容 -->
          <main class="omg-manager__body">
            <DataCenter v-if="activeTab === 'data-center'" />
            <DataStudio v-else-if="activeTab === 'data-studio'" />
            <StyleWorkshop v-else-if="activeTab === 'style-workshop'" />
            <LayoutComposer v-else-if="activeTab === 'layout-composer'" />
            <SystemConfig v-else-if="activeTab === 'system-config'" />
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { OverlayScrollbars } from 'overlayscrollbars';
import 'overlayscrollbars/styles/overlayscrollbars.css';
import DataCenter from './modules/DataCenter.vue';
import DataStudio from './modules/DataStudio.vue';
import LayoutComposer from './modules/LayoutComposer.vue';
import StyleWorkshop from './modules/StyleWorkshop.vue';
import SystemConfig from './modules/SystemConfig.vue';
import { NAV_KEY, type NavigationTarget } from './navigation';

defineEmits<{ close: [] }>();

const tabs = [
  { key: 'data-center', label: '数据中心', icon: 'fa-solid fa-database' },
  { key: 'data-studio', label: '数据工作室', icon: 'fa-solid fa-flask' },
  { key: 'style-workshop', label: '样式工坊', icon: 'fa-solid fa-palette' },
  { key: 'layout-composer', label: '布局编排器', icon: 'fa-solid fa-grip' },
  { key: 'system-config', label: '系统配置', icon: 'fa-solid fa-gear' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const activeTab = ref<TabKey>('data-center');
const navContext = ref<Record<string, string>>({});
const managerRootRef = ref<HTMLElement | null>(null);

const theme = ref<'light' | 'dark'>('dark');

const overlayScrollableSelectors = [
  '.omg-manager__sidebar',
  '.omg-manager__body',
  '.omg-dc__sidebar',
  '.omg-dc__main',
  '.omg-dc__group-body',
  '.omg-ds__categories',
  '.omg-ds__main',
  '.omg-ds__category-list',
  '.omg-ds__entries-list',
  '.omg-lc__sidebar',
  '.omg-lc__main',
  '.omg-lc__tree-body',
  '.omg-lc__props-body',
  '.omg-sw__sidebar',
  '.omg-sw__main',
  '.omg-sw__reference',
  '.omg-sc__body',
] as const;

const scrollbarInstances = new Map<HTMLElement, ReturnType<typeof OverlayScrollbars>>();
let refreshRaf = 0;
let overlayObserver: MutationObserver | null = null;

function destroyOverlayScrollbars() {
  if (refreshRaf) {
    cancelAnimationFrame(refreshRaf);
    refreshRaf = 0;
  }
  if (overlayObserver) {
    overlayObserver.disconnect();
    overlayObserver = null;
  }
  for (const instance of scrollbarInstances.values()) {
    instance.destroy();
  }
  scrollbarInstances.clear();
}

function syncOverlayScrollbars() {
  const root = managerRootRef.value;
  if (!root) return;

  const activeTargets = new Set<HTMLElement>();
  for (const selector of overlayScrollableSelectors) {
    root.querySelectorAll<HTMLElement>(selector).forEach(el => activeTargets.add(el));
  }

  for (const target of activeTargets) {
    const existing = scrollbarInstances.get(target);
    if (existing) {
      existing.update();
      continue;
    }
    const instance = OverlayScrollbars(target, {
      scrollbars: {
        theme: 'os-theme-omg',
        autoHide: 'leave',
        autoHideDelay: 650,
        autoHideSuspend: false,
        clickScroll: true,
        dragScroll: true,
      },
    });
    scrollbarInstances.set(target, instance);
  }

  for (const [target, instance] of scrollbarInstances.entries()) {
    if (!activeTargets.has(target) || !root.contains(target)) {
      instance.destroy();
      scrollbarInstances.delete(target);
    }
  }
}

function scheduleOverlaySync() {
  if (refreshRaf) {
    cancelAnimationFrame(refreshRaf);
  }
  refreshRaf = requestAnimationFrame(() => {
    refreshRaf = 0;
    syncOverlayScrollbars();
  });
}

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
}

function navigateTo(target: NavigationTarget) {
  activeTab.value = target.tab;
  navContext.value = target.context ?? {};
}

provide(NAV_KEY, { navigateTo, navContext });

watch(activeTab, () => {
  nextTick(() => {
    scheduleOverlaySync();
  });
});

onMounted(() => {
  scheduleOverlaySync();
  const root = managerRootRef.value;
  if (!root) return;
  overlayObserver = new MutationObserver(() => {
    scheduleOverlaySync();
  });
  overlayObserver.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style'],
  });
});

onBeforeUnmount(() => {
  destroyOverlayScrollbars();
});
</script>
