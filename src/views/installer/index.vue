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
import { getComponents } from "@/api/installer"

// 响应式数据
const components = ref<Component[]>([])
// 加载状态
const loading = ref(false)

// 接口请求
const getComponentList = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const res = await getComponents()
    if (res.code === 200) {
      components.value = res.data || []
    } else {
      ElMessage.warning(res.message || "获取组件列表无数据")
    }
  } catch (err) {
    ElMessage.error("获取组件列表失败，请刷新重试")
    console.error("获取组件列表失败：", err)
  } finally {
    loading.value = false
  }
}

// 安装组件
const handleInstallComponent = async (row: Component) => {
  if (row.address && row.address.trim()) {
    window.open(row.address, "_blank")
  } else {
    ElMessage.warning("当前组件暂无下载地址")
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
