<template>
  <div class="install-type">
    <h3>选择安装类型</h3>
    <div class="type-options">
      <el-radio-group v-model="installType" class="radio-group" @change="handleTypeChange">
        <el-radio label="full" border class="radio-item">
          <div class="type-card">
            <h4>全量安装</h4>
            <p>安装所有可用组件（推荐）</p>
            <div class="type-desc">
              <span>包含：{{ totalComponents }}个组件</span>
              <span>占用空间：约{{ totalSize }}</span>
            </div>
          </div>
        </el-radio>

        <el-radio label="custom" border class="radio-item">
          <div class="type-card">
            <h4>自定义安装</h4>
            <p>仅安装您需要的组件</p>
            <div class="type-desc">
              <span>灵活选择，节省空间</span>
              <span>需手动勾选组件</span>
            </div>
          </div>
        </el-radio>
      </el-radio-group>
    </div>

    <div class="type-footer">
      <el-button type="primary" @click="$emit('next')"> 下一步 </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue"
import { useInstallerStore } from "@/store/modules/installer"

const installerStore = useInstallerStore()
const _emit = defineEmits(["next"])

const installType = computed({
  get: () => installerStore.state.installType,
  set: (val) => installerStore.setInstallType(val)
})

// 页面挂载时执行setInstallType
onMounted(() => {
  installerStore.setInstallType("full")
})

// 计算组件总数和总大小（模拟）
const totalComponents = computed(() => installerStore.state.components.length)
const totalSize = computed(() => {
  const totalKB = installerStore.state.components.reduce((sum, item) => {
    const size = parseInt(item.size) || 0
    return sum + size
  }, 0)
  return totalKB > 1024 ? `${(totalKB / 1024).toFixed(1)}MB` : `${totalKB}KB`
})

// 安装类型变化处理
const handleTypeChange = (val: "full" | "custom") => {
  installerStore.setInstallType(val)
}
</script>

<style scoped lang="scss">
.install-type {
  h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 20px;
  }

  .type-options {
    margin: 5rem 0;
  }

  .radio-group {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }

  .radio-item {
    flex: 1;
    min-width: 300px;
    height: auto;

    :deep(.el-radio__label) {
      width: 100%;
    }
  }

  .type-card {
    padding: 20px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-top: 8px;

    h4 {
      margin: 0 0 8px 0;
      font-size: 15px;
    }

    p {
      margin: 0 0 15px 0;
      color: #666;
      font-size: 14px;
    }

    .type-desc {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 13px;
      color: #999;
    }
  }

  .type-footer {
    margin-top: 40px;
    text-align: right;
  }
}
</style>
