<script setup lang="ts">
import { ref, onMounted } from "vue"
import {
  ElTable,
  ElTableColumn,
  ElButton,
  ElInput,
  ElPagination,
  ElTag,
  ElMessage,
  TabPaneName,
  ElMessageBox
} from "element-plus"
import { Server, Task } from "@/api/monitoring/types/task-server"
// import {
//   getTasksRunning,
//   getServers,
//   changeServerResource,
//   changeTaskPriority,
//   allocateTaskResources,
//   allocateServerResources
// } from "@/api/monitoring"
// ---------- 响应式数据 ----------
const servers = ref<Server[]>([])
const totalServers = ref(0)
const isLoading = ref(false)

// 任务列表相关
const tasks = ref<Task[]>([])
const totalTasks = ref(0)
const isTaskLoading = ref(false)

// 初始化模拟数据
servers.value = [
  {
    id: 1,
    name: "GPU-Server-01",
    ip: "192.168.1.101",
    type: "GPU服务器",
    status: "running",
    cpuCores: 32,
    memory: 128,
    cpuUsage: 65,
    memoryUsage: 70,
    lastOnline: "2024-06-20 10:15:00"
  },
  {
    id: 2,
    name: "CPU-Server-02",
    ip: "192.168.1.102",
    type: "CPU服务器",
    status: "idle",
    cpuCores: 16,
    memory: 64,
    cpuUsage: 20,
    memoryUsage: 30,
    lastOnline: "2024-06-20 09:50:00"
  },
  {
    id: 3,
    name: "Storage-Server-03",
    ip: "192.168.1.103",
    type: "存储服务器",
    status: "running",
    cpuCores: 8,
    memory: 32,
    cpuUsage: 45,
    memoryUsage: 50,
    lastOnline: "2024-06-20 11:00:00"
  }
]

// 任务模拟数据
tasks.value = [
  {
    id: 1,
    name: "模型训练任务A",
    serverId: 1,
    serverName: "GPU-Server-01",
    type: "模型训练",
    priority: 1,
    cpuCoreNeed: 4,
    memoryNeed: 16,
    progress: 55,
    status: "running",
    startTime: "2024-06-20 08:30:00"
  },
  {
    id: 2,
    name: "数据备份任务B",
    serverId: 3,
    serverName: "Storage-Server-03",
    type: "数据备份",
    priority: 2,
    cpuCoreNeed: 2,
    memoryNeed: 8,
    progress: 80,
    status: "running",
    startTime: "2024-06-20 09:15:00"
  },
  {
    id: 3,
    name: "日志清理任务C",
    serverId: 2,
    serverName: "CPU-Server-02",
    type: "文件处理",
    priority: 3,
    cpuCoreNeed: 1,
    memoryNeed: 4,
    progress: 100,
    status: "completed",
    startTime: "2024-06-20 07:00:00"
  },
  {
    id: 4,
    name: "模型评估任务D",
    serverId: 1,
    serverName: "GPU-Server-01",
    type: "模型评估",
    priority: 1,
    cpuCoreNeed: 4,
    memoryNeed: 16,
    progress: 0,
    status: "pending",
    startTime: "2024-06-20 12:00:00"
  },
  {
    id: 5,
    name: "数据迁移任务E",
    serverId: 1,
    serverName: "GPU-Server-01",
    type: "数据迁移",
    priority: 2,
    cpuCoreNeed: 2,
    memoryNeed: 8,
    progress: 0,
    status: "pending",
    startTime: "2024-06-20 12:30:00"
  },
  {
    id: 6,
    name: "系统更新任务F",
    serverId: 1,
    serverName: "GPU-Server-01",
    type: "系统维护",
    priority: 3,
    cpuCoreNeed: 1,
    memoryNeed: 4,
    progress: 0,
    status: "pending",
    startTime: "2024-06-20 13:00:00"
  }
]

// 搜索 / 筛选（服务器）
const searchQuery = ref("")
const statusFilter = ref("all")
const typeFilter = ref("all")

// 搜索 / 筛选（任务）
const taskSearchQuery = ref("")
const taskStatusFilter = ref("all")
const taskServerFilter = ref(0)

// 分页（服务器）
const currentPage = ref(1)
const pageSize = ref(10)

// 分页（任务）
const taskCurrentPage = ref(1)
const taskPageSize = ref(10)

// 当前激活的标签页
const activeTab = ref("server")

// 服务器资源调整弹窗相关
const showServerResourceDialog = ref(false)
const currentServer = ref<Server | null>(null)
const serverResourceForm = ref({
  cpuCores: 0,
  memory: 0
})

// 任务优先级调整弹窗相关
const showTaskPriorityDialog = ref(false)
const currentTask = ref<Task | null>(null)
const taskPriorityForm = ref(1)

// 资源分配相关响应式数据
const selectedTasks = ref<Task[]>([])
const selectedServers = ref<Server[]>([])
const isAllocating = ref(false)

// ---------- 工具函数 ----------
// 服务器状态处理
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    running: "运行中",
    idle: "空闲",
    offline: "离线",
    maintenance: "维护中"
  }
  return map[status] || "未知"
}

const getStatusTagType = (status: string) => {
  if (status === "running") return "success"
  if (status === "idle") return ""
  if (status === "offline") return "danger"
  if (status === "maintenance") return "info"
  return ""
}

// 任务状态处理
const getTaskStatusText = (status: string) => {
  const map: Record<string, string> = {
    running: "执行中",
    completed: "已完成",
    failed: "失败",
    pending: "待执行"
  }
  return map[status] || "未知"
}

const getTaskStatusTagType = (status: string) => {
  if (status === "running") return "success"
  if (status === "completed") return "info"
  if (status === "failed") return "danger"
  if (status === "pending") return "warning"
  return ""
}

// 优先级文本转换
const getPriorityText = (priority: number) => {
  const map = { 1: "高", 2: "中", 3: "低" }
  return map[priority] || "未知"
}

// 优先级标签类型
const getPriorityTagType = (priority: number) => {
  const map = { 1: "danger", 2: "warning", 3: "info" }
  return map[priority] || ""
}

// 通用任务排序函数
const sortTasks = (tasks: Task[]): Task[] => {
  if (!tasks.length) return []
  return [...tasks].sort((a, b) => {
    return a.priority - b.priority
  })
}

// 验证选中的任务/服务器是否合法
const validateSelection = (): boolean => {
  if (selectedTasks.value.length === 0 && selectedServers.value.length === 0) {
    ElMessage.warning("请至少选择一个任务或服务器！")
    return false
  }
  return true
}

// ---------- API 调用封装 ----------
const fetchServers = async () => {
  isLoading.value = true
  try {
    // const response = await getServers({
    //   pageNum: currentPage.value,
    //   pageSize: pageSize.value,
    //   keyword: searchQuery.value,
    //   status: statusFilter.value,
    //   type: typeFilter.value
    // })
    // if (response.code === 200) {
    //   servers.value = response.data.records
    //   totalServers.value = response.data.total
    // } else {
    //   ElMessage.error("获取服务器列表失败：" + response.message)
    // }
    // 模拟数据刷新
    if (servers.value.length) {
      servers.value = servers.value.map((server) => ({
        ...server,
        cpuUsage: Math.floor(Math.random() * 100),
        memoryUsage: Math.floor(Math.random() * 100)
      }))
    }
    totalServers.value = servers.value.length
    selectedServers.value = []
  } catch (e) {
    console.error("获取服务器列表失败:", e)
    ElMessage.error("获取服务器列表失败")
  } finally {
    isLoading.value = false
  }
}

// 获取任务列表
const fetchTasks = async () => {
  isTaskLoading.value = true
  try {
    // const response = await getTasksRunning({
    //   pageNum: taskCurrentPage.value,
    //   pageSize: taskPageSize.value,
    //   keyword: taskSearchQuery.value,
    //   status: taskStatusFilter.value,
    //   serverId: taskServerFilter.value
    // })
    // if (response.code === 200) {
    //   tasks.value = sortTasks(response.data.records)
    //   totalTasks.value = response.data.total
    // } else {
    //   ElMessage.error("获取任务列表失败：" + response.message)
    // }
    // 模拟数据刷新（开发阶段）
    let taskList = [...tasks.value] // 模拟从后端获取的原始数据
    if (taskList.length) {
      taskList = taskList.map((task) => {
        if (task.status === "running") {
          return {
            ...task,
            progress: Math.min(100, task.progress + Math.floor(Math.random() * 5))
          }
        }
        return task
      })
    }

    // 关键：对后端返回的原始任务数据排序
    tasks.value = sortTasks(taskList)
    totalTasks.value = tasks.value.length
    selectedTasks.value = []

    // 真实后端对接时的写法：
    // const resp = await $http.get('/api/tasks', {
    //   params: { page: taskCurrentPage.value, pageSize: taskPageSize.value, ...其他筛选参数 }
    // })
    // tasks.value = sortTasks(resp.data.list) // 对后端数据排序
    // totalTasks.value = resp.data.total
  } catch (e) {
    ElMessage.error("获取任务列表失败")
  } finally {
    isTaskLoading.value = false
  }
}

// 调整服务器可用资源
const handleSubmitResource = async () => {
  if (!currentServer.value) return

  if (serverResourceForm.value.cpuCores < 1 || serverResourceForm.value.memory < 1) {
    ElMessage.warning("CPU核心数和内存需大于0")
    return
  }
  try {
    // await changeServerResource(currentServer.value.id, {
    //   cpuCores: serverResourceForm.value.cpuCores,
    //   memory: serverResourceForm.value.memory
    // })
    const index = servers.value.findIndex((item) => item.id === currentServer.value!.id)
    if (index !== -1) {
      servers.value[index].cpuCores = serverResourceForm.value.cpuCores
      servers.value[index].memory = serverResourceForm.value.memory

      ElMessage.success("服务器资源调整成功")
      showServerResourceDialog.value = false
      currentServer.value = null
    }
    fetchServers()
  } catch (err) {
    ElMessage.error("服务器资源调整失败")
    console.error(err)
  } finally {
    currentServer.value = null
    showServerResourceDialog.value = false
  }
}

// 调整任务优先级
const handleSubmitPriority = async () => {
  if (!currentTask.value) return
  try {
    // await changeTaskPriority(currentTask.value.id, taskPriorityForm.value)
    const index = tasks.value.findIndex((item) => item.id === currentTask.value!.id)
    if (index !== -1) {
      tasks.value[index].priority = taskPriorityForm.value
      ElMessage.success("任务优先级调整成功")
    }
    fetchTasks()
  } catch (err) {
    ElMessage.error("任务优先级调整失败")
    console.error(err)
  } finally {
    currentTask.value = null
    showTaskPriorityDialog.value = false
  }
}

// 触发自动分配资源
const triggerAutoAllocate = async () => {
  if (!validateSelection()) return

  try {
    const confirmResult = await ElMessageBox.confirm("是否确认分配资源？", "资源分配确认", {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      type: "warning"
    })

    if (confirmResult === "confirm") {
      isAllocating.value = true
      // let res
      // if (activeTab.value === "task") {
      //   const taskIds = selectedTasks.value.map((task) => task.id)
      //   res = await allocateTaskResources(taskIds)
      // } else if (activeTab.value === "server") {
      //   const serverIds = selectedServers.value.map((server) => server.id)
      //   res = await allocateServerResources(serverIds)
      // }
      // if (res.code === 200) {
      //   ElMessage.success("资源分配成功！")
      //   fetchServers()
      //   fetchTasks()
      //   selectedTasks.value = []
      //   selectedServers.value = []
      // } else {
      //   ElMessage.error(`分配失败：${res.message}`)
      // }
      ElMessage.success("资源分配成功！")
      fetchServers()
      fetchTasks()
      selectedTasks.value = []
      selectedServers.value = []
    }
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("资源分配异常，请重试！")
      console.error("分配失败：", error)
    }
  } finally {
    isAllocating.value = false
  }
}

// ---------- 事件处理 ----------
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchServers()
}
// 任务分页切换
const handleTaskPageChange = (page: number) => {
  taskCurrentPage.value = page
  fetchTasks()
}
const resetFilters = () => {
  searchQuery.value = ""
  statusFilter.value = "all"
  typeFilter.value = "all"
  currentPage.value = 1
  fetchServers()
}
// 重置任务筛选
const resetTaskFilters = () => {
  taskSearchQuery.value = ""
  taskStatusFilter.value = "all"
  taskServerFilter.value = 0
  taskCurrentPage.value = 1
  fetchTasks()
}
// 标签页切换时刷新数据
const handleTabChange = (tab: TabPaneName) => {
  const tabStr = typeof tab === "number" ? tab.toString() : tab
  if (tabStr === "server") {
    fetchServers()
  } else if (tabStr === "task") {
    fetchTasks()
  }
}

// 打开服务器资源调整弹窗
const openServerResourceDialog = (server: Server) => {
  currentServer.value = server
  serverResourceForm.value = {
    cpuCores: server.cpuCores,
    memory: server.memory
  }
  showServerResourceDialog.value = true
}

// 打开任务优先级调整弹窗
const openTaskPriorityDialog = (task: Task) => {
  currentTask.value = task
  taskPriorityForm.value = task.priority
  showTaskPriorityDialog.value = true
}

// ---------- 初始化 ----------
onMounted(() => {
  fetchServers()
  fetchTasks()
})
</script>

<template>
  <div class="resource-page">
    <!-- 顶部标签页切换 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="tab-container">
      <el-tab-pane label="服务器管理" name="server">
        <!-- 服务器搜索 / 筛选 -->
        <div class="header">
          <div class="search-container">
            <el-input v-model="searchQuery" placeholder="搜索服务器名称或IP" clearable @keyup.enter="fetchServers" />
            <el-button type="primary" @click="fetchServers" :loading="isLoading">搜索</el-button>
          </div>
          <div class="button-group">
            <el-button @click="fetchServers" :loading="isLoading"> <i class="el-icon-refresh" /> 刷新 </el-button>
            <el-button type="primary" @click="triggerAutoAllocate" :loading="isAllocating"> 自动分配资源 </el-button>
          </div>
        </div>

        <div class="filter-container">
          <el-select v-model="statusFilter" placeholder="状态筛选" clearable>
            <el-option label="全部状态" value="all" />
            <el-option label="运行中" value="running" />
            <el-option label="空闲" value="idle" />
            <el-option label="离线" value="offline" />
            <el-option label="维护中" value="maintenance" />
          </el-select>

          <el-select v-model="typeFilter" placeholder="类型筛选" clearable>
            <el-option label="全部类型" value="all" />
            <el-option label="GPU服务器" value="GPU服务器" />
            <el-option label="CPU服务器" value="CPU服务器" />
            <el-option label="存储服务器" value="存储服务器" />
          </el-select>

          <el-button @click="resetFilters">重置筛选</el-button>
        </div>

        <!-- 服务器列表 -->
        <!-- 服务器列表：新增勾选列 -->
        <el-table
          :data="servers"
          :style="{ width: '100%' }"
          v-loading="isLoading"
          @selection-change="(val) => (selectedServers = val)"
          ref="serverTableRef"
        >
          <!-- 新增：批量选择列 -->
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" label="服务器名称" min-width="150" />
          <el-table-column prop="ip" label="IP地址" width="130" />
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="source" label="可用资源" width="120">
            <template #default="{ row }"> {{ row.cpuCores }} 核心 / {{ row.memory }} GB </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="CPU使用率" width="150">
            <template #default="{ row }">
              <div class="progress-cell">
                <span>{{ row.cpuUsage }}%</span>
                <el-progress
                  :percentage="row.cpuUsage"
                  :color="row.cpuUsage > 80 ? '#f56c6c' : '#67c23a'"
                  :stroke-width="8"
                  :show-text="false"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="内存使用率" width="150">
            <template #default="{ row }">
              <div class="progress-cell">
                <span>{{ row.memoryUsage }}%</span>
                <el-progress
                  :percentage="row.memoryUsage"
                  :color="row.memoryUsage > 80 ? '#f56c6c' : '#409eff'"
                  :stroke-width="8"
                  :show-text="false"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="openServerResourceDialog(row)"> 调整可用资源 </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 服务器分页 -->
        <el-pagination
          background
          layout="total, prev, pager, next, jumper"
          :total="totalServers"
          :current-page="currentPage"
          :page-size="pageSize"
          @current-change="handlePageChange"
          class="pagination"
          :disabled="isLoading"
        />
      </el-tab-pane>

      <el-tab-pane label="任务管理" name="task">
        <!-- 任务搜索 / 筛选 -->
        <div class="header">
          <div class="search-container">
            <el-input
              v-model="taskSearchQuery"
              placeholder="搜索任务名称或服务器名称"
              clearable
              @keyup.enter="fetchTasks"
            />
            <el-button type="primary" @click="fetchTasks" :loading="isTaskLoading">搜索</el-button>
          </div>
          <div class="button-group">
            <el-button @click="fetchTasks" :loading="isTaskLoading"> <i class="el-icon-refresh" /> 刷新 </el-button>
            <!-- 新增：自动分配资源按钮 -->
            <el-button type="primary" @click="triggerAutoAllocate" :loading="isAllocating"> 自动分配资源 </el-button>
          </div>
        </div>

        <div class="filter-container">
          <el-select v-model="taskStatusFilter" placeholder="任务状态筛选" clearable>
            <el-option label="全部状态" value="all" />
            <el-option label="执行中" value="running" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
            <el-option label="待执行" value="pending" />
          </el-select>

          <!-- 所属服务器筛选 -->
          <el-select v-model="taskServerFilter" placeholder="所属服务器筛选" clearable>
            <el-option label="全部服务器" :value="0" />
            <el-option v-for="server in servers" :key="server.id" :label="server.name" :value="server.id" />
          </el-select>

          <el-button @click="resetTaskFilters">重置筛选</el-button>
        </div>

        <!-- 任务列表 -->
        <!-- 任务列表：新增勾选列 -->
        <el-table
          :data="tasks"
          :style="{ width: '100%' }"
          v-loading="isTaskLoading"
          @selection-change="(val) => (selectedTasks = val)"
          ref="taskTableRef"
        >
          <!-- 新增：批量选择列 -->
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" label="任务名称" min-width="180" />
          <el-table-column prop="serverName" label="所属服务器" min-width="150" />
          <el-table-column prop="type" label="任务类型" width="120" />
          <el-table-column prop="priority" label="优先级" width="100">
            <template #default="{ row }">
              <el-tag :type="getPriorityTagType(row.priority)">
                {{ getPriorityText(row.priority) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sourceNeed" label="资源需求" width="120">
            <template #default="{ row }"> {{ row.cpuCoreNeed }} 核心 / {{ row.memoryNeed }} GB </template>
          </el-table-column>
          <el-table-column prop="status" label="任务状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getTaskStatusTagType(row.status)">
                {{ getTaskStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="执行进度" width="180">
            <template #default="{ row }">
              <div class="progress-cell">
                <span>{{ row.progress }}%</span>
                <el-progress
                  :percentage="row.progress"
                  :color="row.progress === 100 ? '#67c23a' : row.progress > 80 ? '#e6a23c' : '#409eff'"
                  :stroke-width="8"
                  :show-text="false"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="startTime" label="开始时间" width="180" />
          <el-table-column label="操作" width="180" fixed="right" class="operation">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="openTaskPriorityDialog(row)"> 调整优先级 </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 任务分页 -->
        <el-pagination
          background
          layout="total, prev, pager, next, jumper"
          :total="totalTasks"
          :current-page="taskCurrentPage"
          :page-size="taskPageSize"
          @current-change="handleTaskPageChange"
          class="pagination"
          :disabled="isTaskLoading"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 服务器可用资源调整弹窗 -->
    <el-dialog
      title="调整服务器可用资源"
      v-model="showServerResourceDialog"
      width="400px"
      @close="currentServer = null"
    >
      <el-form :model="serverResourceForm" label-width="100px">
        <el-form-item label="CPU核心数" prop="cpuCores">
          <el-input-number
            v-model="serverResourceForm.cpuCores"
            :min="1"
            :step="1"
            placeholder="请输入CPU核心数"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="内存(GB)" prop="memory">
          <el-input-number
            v-model="serverResourceForm.memory"
            :min="1"
            :step="1"
            placeholder="请输入内存大小"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showServerResourceDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitResource">确定</el-button>
      </template>
    </el-dialog>

    <!-- 任务优先级调整弹窗 -->
    <el-dialog title="调整任务优先级" v-model="showTaskPriorityDialog" width="400px" @close="currentTask = null">
      <el-form :model="taskPriorityForm.valueOf" label-width="100px">
        <el-form-item label="任务优先级" prop="priority">
          <el-select v-model="taskPriorityForm" placeholder="请选择优先级" style="width: 100%">
            <el-option label="高" :value="1" />
            <el-option label="中" :value="2" />
            <el-option label="低" :value="3" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTaskPriorityDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitPriority">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.resource-page {
  padding: 20px;
  background-color: #fff;
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;

  .tab-container {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }

  .el-tabs__content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }

  .header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 15px;

    .search-container {
      display: flex;
      gap: 10px;
      flex-grow: 1;
      max-width: 500px;
    }

    .button-group {
      display: flex;
      gap: 10px;
    }
  }

  .filter-container {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .el-table {
    margin: 20px 0;
    flex-grow: 1;

    .progress-cell {
      display: flex;
      flex-direction: column;
      gap: 5px;

      span {
        font-size: 14px;
        font-weight: 500;
      }
    }
  }

  .pagination {
    margin-top: 20px;
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>
