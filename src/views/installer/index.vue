<template>
  <div class="component-page">
    <el-table :data="components" style="width: 100%" v-loading="loading" element-loading-text="正在加载组件列表...">
      <el-table-column prop="name" label="组件名称" min-width="200">
        <template #default="scope">
          <div class="name-with-tooltip">
            <span>{{ scope.row.name }}</span>
            <el-tooltip
              class="ml-1"
              effect="dark"
              :content="scope.row.description"
              placement="top"
              popper-class="component-desc-tooltip"
            >
              <el-icon size="14" class="question-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="version" label="版本" width="100" />
      <el-table-column prop="size" label="安装包大小" width="120" />
      <el-table-column label="操作" :fixed="'right'">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleInstallComponent(scope.row)"> 下载 </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { ElMessage } from "element-plus"
import { QuestionFilled } from "@element-plus/icons-vue"
import type { Component } from "@/api/installer/types"
// import { getComponents, installComponent } from "@/api/installer"

// 响应式数据
const components = ref<Component[]>([])
// 加载状态
const loading = ref(false)

// ========== 模拟数据 ==========
components.value = [
  {
    id: 1,
    name: "冲击前处理程序",
    version: "1.2.0",
    size: "2.5MB",
    description: "提供丰富的数据可视化图表功能，支持折线图、柱状图、饼图等多种图表类型，可自定义样式和交互效果",
    dynamicsDirection: "冲击",
    moduleType: "前处理"
  },
  {
    id: 2,
    name: "结构前处理程序",
    version: "2.0.1",
    size: "4.8MB",
    description: "支持Excel文件的导入和导出操作，兼容.xlsx和.xls格式，可自定义导入校验规则和导出模板",
    dynamicsDirection: "结构",
    moduleType: "前处理"
  },
  {
    id: 3,
    name: "多体前处理程序",
    version: "3.1.5",
    size: "3.2MB",
    description: "提供强大的富文本编辑功能，支持图片上传、格式排版、表格插入、代码块等常用编辑能力",
    dynamicsDirection: "多体",
    moduleType: "前处理"
  },
  {
    id: 4,
    name: "CPU冲击求解器程序",
    version: "1.8.3",
    size: "1.9MB",
    description: "实现用户权限和角色管理功能，支持基于RBAC模型的权限控制，可配置菜单权限、按钮权限等",
    dynamicsDirection: "冲击",
    moduleType: "求解器",
    resourceType: "CPU"
  },
  {
    id: 5,
    name: "GPU冲击求解器程序",
    version: "1.8.3",
    size: "1.9MB",
    description: "实现用户权限和角色管理功能，支持基于RBAC模型的权限控制，可配置菜单权限、按钮权限等",
    dynamicsDirection: "冲击",
    moduleType: "求解器",
    resourceType: "GPU"
  },
  {
    id: 6,
    name: "结构求解器程序",
    version: "4.0.0",
    size: "1.1MB",
    description: "提供基础的表格展示和操作功能，支持排序、筛选、分页、单元格编辑等基础能力",
    dynamicsDirection: "结构",
    moduleType: "求解器"
  },
  {
    id: 7,
    name: "多体求解器程序",
    version: "2.7.8",
    size: "0.8MB",
    description: "支持多种样式和功能的弹窗展示，包括普通提示、确认弹窗、自定义内容弹窗等，可配置动画效果",
    dynamicsDirection: "多体",
    moduleType: "求解器"
  },
  {
    id: 8,
    name: "后处理程序",
    version: "3.3.2",
    size: "1.5MB",
    description: "提供灵活的表单校验规则和提示功能，支持同步/异步校验，可自定义校验提示样式和位置"
  }
]

// 接口请求
const getComponentList = async () => {
  if (loading.value) return
  loading.value = true
  try {
    // const res = await getComponents()
    // if (res.code === 200) {
    //   components.value = res.data || []
    // } else {
    //   ElMessage.warning(res.message || "获取组件列表无数据")
    // }
  } catch (err) {
    ElMessage.error("获取组件列表失败，请刷新重试")
    console.error("获取组件列表失败：", err)
  } finally {
    loading.value = false
  }
}

// 安装组件
const handleInstallComponent = async (row: Component) => {
  // const installParams: InstallComponentParams = {
  //   id: row.id,
  //   name: row.name,
  //   dynamicsDirection: row.dynamicsDirection,
  //   moduleType: row.moduleType,
  //   resourceType: row.resourceType
  // }

  try {
    // const res = await installComponent(installParams)
    // if (res.code === 200) {
    //   ElMessage.success(`组件"${row.name}"下载成功`)
    //   await getComponentList()
    // } else {
    //   ElMessage.error(`组件"${row.name}"下载失败：${res.message}`)
    // }
    ElMessage.success(`已触发"${row.name}"组件安装包下载`)
  } catch (err) {
    ElMessage.error(`触发"${row.name}"安装包下载失败，请重试`)
    console.error(`安装组件失败：`, err)
  }
}

// 页面加载时获取组件列表
onMounted(() => {
  getComponentList()
})
</script>

<style scoped lang="scss">
.component-page {
  width: 100%;
  margin: 20px auto;
  padding: 0 20px;
}
.el-table {
  margin: 20px 0;
  flex-grow: 1;
}
</style>
