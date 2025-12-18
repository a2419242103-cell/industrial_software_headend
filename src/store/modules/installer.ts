import { defineStore } from "pinia"
import { ref, computed } from "vue"
import type { ComponentInfo, InstallState } from "@/types/installer"
import { validatePath } from "@/utils/installer"

// 模拟组件列表，建立后端接口
const mockComponents: ComponentInfo[] = [
  // 基础功能组件
  {
    id: "base-button",
    name: "基础按钮",
    description: "通用按钮组件，支持多种样式/状态",
    version: "1.0.0",
    category: "基础功能组件",
    size: "12KB",
    selected: false,
    installed: false
  },
  {
    id: "base-table",
    name: "数据表格",
    description: "支持排序/筛选/分页的表格组件",
    version: "2.1.0",
    category: "基础功能组件",
    size: "28KB",
    selected: false,
    installed: false
  },
  // 扩展工具组件
  {
    id: "ext-chart",
    name: "图表组件",
    description: "基于ECharts的可视化图表",
    version: "3.0.5",
    category: "扩展工具组件",
    size: "156KB",
    selected: false,
    installed: false
  },
  {
    id: "ext-form",
    name: "表单构建",
    description: "可视化表单设计组件",
    version: "1.8.2",
    category: "扩展工具组件",
    size: "98KB",
    selected: false,
    installed: false
  }
]

export const useInstallerStore = defineStore("installer", () => {
  // 状态
  const state = ref<InstallState>({
    step: 0,
    installType: "full",
    installPath: "",
    components: mockComponents,
    installationProgress: 0,
    installationStatus: "idle",
    installationLog: [],
    uninstallProgress: 0
  })

  // 计算属性
  const categories = computed(() => {
    return Array.from(new Set(state.value.components.map((c) => c.category)))
  })

  const componentsByCategory = computed(() => (category: string) => {
    return state.value.components.filter((c) => c.category === category)
  })

  const installedComponents = computed(() => {
    return state.value.components.filter((c) => c.installed)
  })

  const selectedComponents = computed(() => {
    return state.value.components.filter((c) => c.selected)
  })

  // 方法：切换组件选择
  const toggleComponent = (id: string) => {
    const component = state.value.components.find((c) => c.id === id)
    if (component) component.selected = !component.selected
  }

  // 全选/取消全选组件
  const selectAllComponents = (category?: string) => {
    const targetComponents = category
      ? state.value.components.filter((c) => c.category === category)
      : state.value.components
    targetComponents.forEach((c) => (c.selected = true))
  }

  const deselectAllComponents = (category?: string) => {
    const targetComponents = category
      ? state.value.components.filter((c) => c.category === category)
      : state.value.components
    targetComponents.forEach((c) => (c.selected = false))
  }

  // 设置安装类型
  const setInstallType = (type: "full" | "custom") => {
    state.value.installType = type
    if (type === "full") {
      selectAllComponents() // 全量安装选中所有组件
    } else {
      deselectAllComponents() // 自定义安装默认取消全选
    }
  }

  // 设置安装路径
  const setInstallPath = (path: string) => {
    if (validatePath(path)) {
      state.value.installPath = path
      return true
    }
    return false
  }

  // 模拟安装过程
  const startInstall = async () => {
    state.value.installationStatus = "installing"
    state.value.installationProgress = 0
    state.value.installationLog = []
    state.value.installationLog.push(`[${new Date().toLocaleString()}] 开始安装...`)

    const componentsToInstall = selectedComponents.value
    const total = componentsToInstall.length

    for (let i = 0; i < total; i++) {
      const component = componentsToInstall[i]
      await new Promise((resolve) => setTimeout(resolve, 800)) // 模拟耗时

      // 模拟10%概率出错
      if (Math.random() < 0.1 && i > 0) {
        state.value.installationStatus = "failed"
        state.value.errorMessage = `安装组件 "${component.name}" 失败：文件写入错误`
        state.value.installationLog.push(`[${new Date().toLocaleString()}] 错误：${state.value.errorMessage}`)
        return
      }

      // 更新进度
      state.value.installationProgress = Math.round(((i + 1) / total) * 100)
      state.value.installationLog.push(
        `[${new Date().toLocaleString()}] 已安装：${component.name} v${component.version}`
      )

      // 标记组件为已安装
      component.installed = true
      component.installTime = new Date().toLocaleString()
    }

    state.value.installationStatus = "success"
    state.value.installationLog.push(`[${new Date().toLocaleString()}] 所有组件安装完成！`)
  }

  // 重试安装
  const retryInstall = () => {
    startInstall()
  }

  // 跳过错误继续
  const skipError = () => {
    state.value.errorMessage = undefined
    startInstall()
  }

  // 模拟卸载组件
  const uninstallComponents = async (ids: string[]) => {
    state.value.uninstallProgress = 0
    const total = ids.length

    for (let i = 0; i < total; i++) {
      const id = ids[i]
      const component = state.value.components.find((c) => c.id === id)
      if (component) {
        await new Promise((resolve) => setTimeout(resolve, 600))
        state.value.uninstallProgress = Math.round(((i + 1) / total) * 100)
        component.installed = false
        component.selected = false
      }
    }
  }

  // 重置安装状态
  const resetInstallState = () => {
    state.value.step = 0
    state.value.installationStatus = "idle"
    state.value.installationProgress = 0
    state.value.errorMessage = undefined
  }

  return {
    state,
    categories,
    componentsByCategory,
    installedComponents,
    selectedComponents,
    toggleComponent,
    selectAllComponents,
    deselectAllComponents,
    setInstallType,
    setInstallPath,
    startInstall,
    retryInstall,
    skipError,
    uninstallComponents,
    resetInstallState
  }
})
