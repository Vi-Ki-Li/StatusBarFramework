<template>
  <div class="omg-root" :data-omg-theme="theme">
    <div class="omg-manager-overlay" @click.self="$emit('close')">
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
import DataCenter from './modules/DataCenter.vue';
import DataStudio from './modules/DataStudio.vue';
import LayoutComposer from './modules/LayoutComposer.vue';
import StyleWorkshop from './modules/StyleWorkshop.vue';
import SystemConfig from './modules/SystemConfig.vue';

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

const theme = ref<'light' | 'dark'>('dark');

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
}
</script>
