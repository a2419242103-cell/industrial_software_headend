<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { ElMessage } from "element-plus"
import type { LicenseRequestItem } from "@/api/license/types/license"
import { getLicenseRequestsApi, getLicenseRequestsMock } from "@/api/license"
import { LICENSE_PERMISSIONS, LICENSE_REQUEST_STATUS_OPTIONS } from "@/constants/license"
import { useUserStoreHook } from "@/store/modules/user"

const userStore = useUserStoreHook()

const requests = ref<LicenseRequestItem[]>([])
const loading = ref(false)
const errorMessage = ref("")

const permissionLabelMap = computed(() =>
  LICENSE_PERMISSIONS.reduce<Record<string, string>>((acc, item) => {
    acc[item.value] = item.label
    return acc
  }, {})
)

const statusLabelMap = computed(() =>
  LICENSE_REQUEST_STATUS_OPTIONS.reduce<Record<string, string>>((acc, item) => {
    acc[item.value] = item.label
    return acc
  }, {})
)

const statusTypeMap: Record<LicenseRequestItem["status"], "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger"
}

const filteredRequests = computed(() => {
  const currentUser = userStore.username
  return currentUser ? requests.value.filter((item) => item.userName === currentUser) : requests.value
})

const fetchRequests = async () => {
  loading.value = true
  errorMessage.value = ""
  try {
    const response = await getLicenseRequestsApi({ userName: userStore.username || undefined })
    if (response.code === 200) {
      requests.value = response.data
    } else {
      ElMessage.error(response.message || "加载许可证申请列表失败")
    }
  } catch (error) {
    errorMessage.value = "加载许可证申请列表失败，已展示模拟数据。"
    const mockResponse = await getLicenseRequestsMock()
    requests.value = mockResponse.data
  } finally {
    loading.value = false
  }
}

const handleDownload = (row: LicenseRequestItem) => {
  const label = row.licenseNo ?? row.requestId
  ElMessage.success(`已开始下载许可证：${label}`)
}

onMounted(fetchRequests)
</script>

<template>
  <div class="license-download-page">
    <div class="page-header">
      <div>
        <h2 class="title">许可证下载</h2>
        <p class="subtitle">查看当前用户的申请记录，审批通过后可下载许可证。</p>
      </div>
    </div>

    <el-alert v-if="errorMessage" :title="errorMessage" type="warning" show-icon class="error-alert" />

    <el-table :data="filteredRequests" style="width: 100%" v-loading="loading" row-key="requestId">
      <el-table-column prop="requestId" label="申请编号" min-width="140" />
      <el-table-column prop="categoryName" label="模块类别" min-width="120" />
      <el-table-column prop="moduleName" label="模块名称" min-width="140" />
      <el-table-column label="使用期限" min-width="180">
        <template #default="{ row }">{{ row.validFrom }} ~ {{ row.validTo }}</template>
      </el-table-column>
      <el-table-column prop="usageCount" label="使用次数" min-width="100" />
      <el-table-column label="权限" min-width="180">
        <template #default="{ row }">
          <el-tag v-for="item in row.permissions" :key="item" type="info" class="permission-tag">
            {{ permissionLabelMap[item] || item }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" min-width="110">
        <template #default="{ row }">
          <el-tag :type="statusTypeMap[row.status]">
            {{ statusLabelMap[row.status] || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="licenseNo" label="许可证编号" min-width="160">
        <template #default="{ row }">{{ row.licenseNo || "-" }}</template>
      </el-table-column>
      <el-table-column prop="createdAt" label="申请时间" min-width="120" />
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button v-if="row.status === 'approved'" size="small" type="primary" @click="handleDownload(row)">
            下载
          </el-button>
          <span v-else class="muted">--</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.license-download-page {
  padding: 20px;
  background-color: #fff;
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.title {
  margin: 0;
  font-size: 20px;
}

.subtitle {
  margin: 6px 0 0;
  color: #6b7280;
}

.error-alert {
  margin-bottom: 16px;
}

.permission-tag {
  margin-right: 6px;
}

.muted {
  color: #9ca3af;
}
</style>
