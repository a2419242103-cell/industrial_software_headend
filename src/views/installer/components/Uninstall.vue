<template>
  <div class="uninstall-page">
    <h3>已安装组件管理</h3>

    <!-- 搜索框 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索组件名称/版本/分类"
        prefix-icon="Search"
        class="search-input"
      />
      <div class="buttons">
        <el-button type="primary" @click="handleUninstall" :disabled="selectedIds.length === 0" class="uninstall-btn">
          卸载选中组件
        </el-button>
        <el-button type="primary" @click="_handleBack" class="uninstall-btn"> 完成 </el-button>
      </div>
    </div>

    <!-- 组件列表 -->
    <el-table :data="filteredComponents" border @selection-change="handleSelectionChange" class="components-table">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="name" label="组件名称" min-width="200" />
      <el-table-column prop="version" label="版本" width="100" />
      <el-table-column prop="category" label="分类" width="150" />
      <el-table-column prop="size" label="大小" width="100" />
      <el-table-column prop="installTime" label="安装时间" width="200" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="scope">
          <el-button type="danger" size="small" @click="handleSingleUninstall(scope.row)"> 卸载 </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 卸载进度弹窗 -->
    <el-dialog
      title="正在卸载"
      v-model="uninstallProgressVisible"
      :close-on-click-modal="false"
      :show-close="true"
      width="500px"
    >
      <div class="uninstall-progress">
        <el-progress :percentage="installerStore.state.uninstallProgress" :stroke-width="8" class="progress-bar" />
        <div class="progress-text">{{ installerStore.state.uninstallProgress }}% 完成</div>
        <div class="uninstall-status" v-if="currentUninstallComponent">正在卸载：{{ currentUninstallComponent }}</div>
      </div>
    </el-dialog>

    <!-- 确认弹窗 -->
    <el-dialog title="确认卸载" v-model="confirmVisible" width="400px">
      <div class="confirm-content">
        <p>确定要卸载以下组件吗？</p>
        <ul class="confirm-list">
          <li v-for="id in selectedIds" :key="id">
            {{ getComponentName(id) }}
          </li>
        </ul>
        <p class="warning-text">卸载后将无法使用该组件的功能！</p>
      </div>
      <template #footer>
        <el-button @click="confirmVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmUninstall"> 确认卸载 </el-button>
      </template>
    </el-dialog>

    <!-- 结果提示 -->
    <el-dialog title="卸载完成" v-model="resultVisible" width="400px">
      <div class="result-content">
        <el-icon size="32" color="#67c23a" class="result-icon">
          <SuccessFilled />
        </el-icon>
        <p>已成功卸载 {{ uninstalledCount }} 个组件</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="resultVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
// import { ElMessage } from "element-plus"
import { SuccessFilled } from "@element-plus/icons-vue"
import { useInstallerStore } from "@/store/modules/installer"

const installerStore = useInstallerStore()
const emit = defineEmits(["back"])

// 状态管理
const searchKeyword = ref("")
const selectedIds = ref<string[]>([])
const confirmVisible = ref(false)
const uninstallProgressVisible = ref(false)
const resultVisible = ref(false)
const currentUninstallComponent = ref("")
const uninstalledCount = ref(0)

// 筛选组件
const filteredComponents = computed(() => {
  const keyword = searchKeyword.value.toLowerCase()
  return installerStore.installedComponents.filter(
    (component) =>
      component.name.toLowerCase().includes(keyword) ||
      component.version.toLowerCase().includes(keyword) ||
      component.category.toLowerCase().includes(keyword)
  )
})

// 表格选择变化
const handleSelectionChange = (val: any[]) => {
  selectedIds.value = val.map((item) => item.id)
}

// 获取组件名称
const getComponentName = (id: string) => {
  const component = installerStore.state.components.find((c) => c.id === id)
  return component?.name || id
}

// 单个组件卸载
const handleSingleUninstall = (row: any) => {
  selectedIds.value = [row.id]
  confirmVisible.value = true
}

// 批量卸载
const handleUninstall = () => {
  confirmVisible.value = true
}

// 确认卸载
const confirmUninstall = async () => {
  confirmVisible.value = false
  uninstallProgressVisible.value = true
  uninstalledCount.value = selectedIds.value.length

  // 清除之前的监听器
  const unwatch = watch(
    () => installerStore.state.uninstallProgress,
    (val) => {
      // 确保正确计算当前卸载的组件
      if (selectedIds.value.length > 0) {
        const index = Math.min(Math.floor(val / (100 / selectedIds.value.length)), selectedIds.value.length - 1)
        currentUninstallComponent.value = getComponentName(selectedIds.value[index])
      }

      if (val === 100) {
        setTimeout(() => {
          uninstallProgressVisible.value = false
          resultVisible.value = true
          selectedIds.value = []
          unwatch()
        }, 2000)
      }
    },
    { immediate: true }
  )

  // 执行卸载
  try {
    await installerStore.uninstallComponents(selectedIds.value)
  } catch (error) {
    console.error("卸载失败:", error)
    uninstallProgressVisible.value = false
    unwatch()
  }
}

// 返回
const _handleBack = () => {
  emit("back")
}
</script>

<style scoped lang="scss">
.uninstall-page {
  h3 {
    margin-bottom: 20px;
    font-size: 16px;
    font-weight: 600;
  }

  .search-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .search-input {
      width: 300px;
    }
  }

  .components-table {
    width: 100%;
  }

  .uninstall-progress {
    padding: 20px;
    text-align: center;

    .progress-bar {
      margin-bottom: 15px;
    }

    .progress-text {
      font-size: 16px;
      margin-bottom: 10px;
    }

    .uninstall-status {
      color: #666;
      font-size: 14px;
    }
  }

  .confirm-content {
    .confirm-list {
      max-height: 200px;
      overflow-y: auto;
      padding-left: 20px;
      margin: 10px 0;
    }

    .warning-text {
      color: #f56c6c;
      margin-top: 10px;
    }
  }

  .result-content {
    text-align: center;
    padding: 20px 0;

    .result-icon {
      margin-bottom: 15px;
    }

    p {
      font-size: 16px;
      margin: 0;
    }
  }
}
</style>
