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

        <!-- 导航标签栏 -->
        <nav class="omg-manager__nav">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="omg-manager__nav-item"
            :class="{ 'omg-manager__nav-item--active': activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            <i :class="tab.icon" />
            {{ tab.label }}
          </button>
        </nav>

        <!-- 内容区 -->
        <main class="omg-manager__body">
          <div v-if="activeTab === 'data-center'">
            <p class="omg-text--muted">数据中心 — 开发中</p>
          </div>
          <div v-else-if="activeTab === 'data-studio'">
            <p class="omg-text--muted">数据工作室 — 开发中</p>
          </div>
          <div v-else-if="activeTab === 'style-workshop'">
            <p class="omg-text--muted">样式工坊 — 开发中</p>
          </div>
          <div v-else-if="activeTab === 'layout-composer'">
            <p class="omg-text--muted">布局编排器 — 开发中</p>
          </div>
          <div v-else-if="activeTab === 'system-config'">
            <p class="omg-text--muted">系统配置 — 开发中</p>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
