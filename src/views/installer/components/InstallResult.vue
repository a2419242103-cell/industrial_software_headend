<template>
  <div class="install-result">
    <!-- 结果状态 -->
    <el-result
      :icon="installerStore.state.installationStatus === 'success' ? 'success' : 'error'"
      :title="installerStore.state.installationStatus === 'success' ? '安装成功' : '安装失败'"
      :subTitle="
        installerStore.state.installationStatus === 'success'
          ? `已成功安装 ${installerStore.selectedComponents.length} 个组件`
          : installerStore.state.errorMessage || '部分组件安装失败'
      "
    >
      <!-- 成功时显示已安装组件 -->
      <template v-if="installerStore.state.installationStatus === 'success'" #extra>
        <div class="result-components">
          <h4>已安装组件列表</h4>
          <el-table :data="installerStore.selectedComponents" border size="small" class="components-table">
            <el-table-column prop="name" label="组件名称" />
            <el-table-column prop="version" label="版本" />
            <el-table-column prop="category" label="分类" />
            <el-table-column prop="installTime" label="安装时间" />
          </el-table>
        </div>
      </template>
    </el-result>

    <!-- 操作按钮 -->
    <div class="result-footer">
      <el-button @click="viewLog" type="link">查看安装日志</el-button>
      <el-button v-if="installerStore.state.installationStatus === 'success'" @click="launchApp"> 立即启动 </el-button>
      <el-button type="primary" @click="_handleBack">
        {{ installerStore.state.installationStatus === "success" ? "安装新组件" : "返回" }}
      </el-button>
      <el-button
        v-if="installerStore.state.installationStatus === 'success'"
        type="warning"
        @click="$emit('uninstall')"
      >
        管理组件
      </el-button>
    </div>

    <!-- 日志弹窗 -->
    <el-dialog title="安装日志" v-model="logVisible" width="80%" top="5vh">
      <div class="log-dialog-content">
        <p v-for="(log, index) in installerStore.state.installationLog" :key="index">
          {{ log }}
        </p>
      </div>
      <template #footer>
        <el-button @click="logVisible = false">关闭</el-button>
        <el-button type="primary" @click="exportLog">导出日志</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { ElMessage } from "element-plus"
import { useInstallerStore } from "@/store/modules/installer"

const installerStore = useInstallerStore()
const _emit = defineEmits(["back", "uninstall", "outUninstall"])
const logVisible = ref(false)

// 查看日志
const viewLog = () => {
  logVisible.value = true
}

// 启动应用（模拟）
const launchApp = () => {
  ElMessage.success("正在启动应用程序...")
  // 实际项目中可调用Electron的启动API
}

// 导出日志（模拟）
const exportLog = () => {
  const logContent = installerStore.state.installationLog.join("\n")
  const blob = new Blob([logContent], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `install-log-${new Date().getTime()}.txt`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success("日志已导出")
}

// 返回
const _handleBack = () => {
  _emit("outUninstall")
  _emit("back")
}
</script>

<style scoped lang="scss">
.install-result {
  .result-components {
    margin-bottom: 20px;

    h4 {
      margin-bottom: 10px;
      font-size: 14px;
      font-weight: 600;
    }

    .components-table {
      width: 100%;
    }
  }

  .log-dialog-content {
    max-height: 60vh;
    overflow-y: auto;
    padding: 10px;
    background: #f9fafb;
    border-radius: 6px;
    font-family: monospace;
    font-size: 13px;
    white-space: pre-wrap;
  }

  .result-footer {
    margin-top: 20px;
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .el-result__extra {
    width: -webkit-fill-available;
  }
}
</style>
