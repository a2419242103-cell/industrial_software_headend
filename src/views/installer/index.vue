<template>
  <div class="installer-container">
    <!-- 步骤导航 -->
    <el-steps :active="installerStore.state.step" class="install-steps">
      <el-step
        v-for="(step, index) in INSTALL_STEPS"
        :key="step.key"
        :title="step.name"
        :description="getStepDesc(index)"
        :disabled="index > installerStore.state.step"
      />
    </el-steps>

    <!-- 步骤内容 -->
    <div class="install-content">
      <!-- 1. 安装类型选择 -->
      <InstallType v-if="installerStore.state.step === 0" @next="nextStep" />

      <!-- 2. 组件选择 -->
      <ComponentSelect v-if="installerStore.state.step === 1" @prev="prevStep" @next="nextStep" />

      <!-- 3. 安装配置 -->
      <InstallConfig v-if="installerStore.state.step === 2" @prev="prevStep" @next="startInstall" />

      <!-- 4. 安装进度 -->
      <InstallProgress v-if="installerStore.state.step === 3" @prev="prevStep" @next="nextStep" />

      <!-- 5. 安装结果 -->
      <InstallResult
        v-if="installerStore.state.step === 4"
        @back="resetInstall"
        @uninstall="goToUninstall"
        @outUninstall="leaveUninstall"
      />

      <!-- 卸载页面 -->
      <Uninstall v-if="isUninstallPage" @back="leaveUninstall" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useInstallerStore } from "@/store/modules/installer"
import { INSTALL_STEPS } from "@/types/installer"
import InstallType from "./components/InstallType.vue"
import ComponentSelect from "./components/ComponentSelect.vue"
import InstallConfig from "./components/InstallConfig.vue"
import InstallProgress from "./components/InstallProgress.vue"
import InstallResult from "./components/InstallResult.vue"
import Uninstall from "./components/Uninstall.vue"

const installerStore = useInstallerStore()
const isUninstallPage = ref(false)

// 步骤描述
const getStepDesc = (index: number) => {
  switch (index) {
    case 1:
      return installerStore.state.installType === "full" ? "全量安装" : "自定义选择"
    case 2:
      return `路径：${installerStore.state.installPath || "未设置"}`
    case 3:
      return `${installerStore.state.installationProgress}%`
    default:
      return ""
  }
}

// 步骤导航
const nextStep = () => {
  if (installerStore.state.step < INSTALL_STEPS.length - 1) {
    installerStore.state.step++
  }
}

const prevStep = () => {
  if (installerStore.state.step > 0) {
    installerStore.state.step--
  }
}

// 开始安装
const startInstall = () => {
  nextStep()
  installerStore.startInstall()
}

// 重置安装状态
const resetInstall = () => {
  installerStore.resetInstallState()
}

// 卸载相关
const goToUninstall = () => {
  isUninstallPage.value = true
}

const leaveUninstall = () => {
  isUninstallPage.value = false
}
</script>

<style scoped lang="scss">
.installer-container {
  max-width: 1200px;
  margin: 20px;
  padding: 0 20px;
}

.install-steps {
  margin-bottom: 30px;
}

.install-content {
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
</style>
