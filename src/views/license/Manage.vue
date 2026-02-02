<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import {
  ElMessage,
  ElMessageBox,
  ElPagination,
  ElAlert,
  ElDialog,
  ElDescriptions,
  ElDescriptionsItem
} from "element-plus"
import type { UploadRequestOptions } from "element-plus"
import LicenseSearchForm from "./components/LicenseSearchForm.vue"
import LicenseTable from "./components/LicenseTable.vue"
import type { LicenseItem, LicenseListQuery, LicenseRequestItem, ModuleCategory } from "@/api/license/types/license"
import { LICENSE_PERMISSIONS, LICENSE_REQUEST_STATUS_OPTIONS } from "@/constants/license"
import {
  approveLicenseRequestApi,
  approveLicenseRequestMock,
  getLicenseListApi,
  getLicenseListMock,
  getModuleCategoriesApi,
  getModuleCategoriesMock,
  getLicenseRequestsApi,
  getLicenseRequestsMock,
  rejectLicenseRequestApi,
  rejectLicenseRequestMock,
  uploadLicenseFileApi,
  uploadLicenseFileMock
} from "@/api/license"

const categories = ref<ModuleCategory[]>([])
const query = ref<LicenseListQuery>({
  pageNum: 1,
  pageSize: 10,
  licenseNo: "",
  categoryId: "",
  status: ""
})
const requestQuery = ref<LicenseListQuery>({
  pageNum: 1,
  pageSize: 10,
  licenseNo: "",
  categoryId: "",
  status: ""
})
const licenses = ref<LicenseItem[]>([])
const licenseRequests = ref<LicenseRequestItem[]>([])
const total = ref(0)
const loading = ref(false)
const errorMessage = ref("")
const requestLoading = ref(false)
const requestErrorMessage = ref("")
const uploadingRequestMap = ref<Record<string, boolean>>({})
const detailVisible = ref(false)
const selectedLicense = ref<LicenseItem | null>(null)

const permissionLabelMap = computed(() =>
  LICENSE_PERMISSIONS.reduce<Record<string, string>>((acc, item) => {
    acc[item.value] = item.label
    return acc
  }, {})
)

const requestStatusLabelMap = computed(() =>
  LICENSE_REQUEST_STATUS_OPTIONS.reduce<Record<string, string>>((acc, item) => {
    acc[item.value] = item.label
    return acc
  }, {})
)

const requestStatusTypeMap: Record<LicenseRequestItem["status"], "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger"
}

const selectedPermissionLabels = computed(() => {
  if (!selectedLicense.value) return []
  return selectedLicense.value.permissions.map((item) => permissionLabelMap.value[item] || item)
})

const filteredRequests = computed(() => {
  const { categoryId, status } = requestQuery.value
  return licenseRequests.value.filter((item) => {
    const matchCategory = categoryId ? item.categoryId === categoryId : true
    const matchStatus = status ? item.status === status : true
    return matchCategory && matchStatus
  })
})

const getRequestStatusLabel = (row: LicenseRequestItem) => {
  if (row.status === "approved" && !row.licenseNo) return "待上传"
  return requestStatusLabelMap.value[row.status] || row.status
}

const getRequestStatusType = (row: LicenseRequestItem) => {
  if (row.status === "approved" && !row.licenseNo) return "warning"
  return requestStatusTypeMap[row.status]
}

const fetchCategories = async () => {
  try {
    const response = await getModuleCategoriesApi()
    if (response.code === 200) {
      categories.value = response.data
    } else {
      ElMessage.error(response.message || "加载模块分类失败")
    }
  } catch (error) {
    const mockResponse = await getModuleCategoriesMock()
    categories.value = mockResponse.data
  }
}

const fetchRequests = async () => {
  requestLoading.value = true
  requestErrorMessage.value = ""
  try {
    const response = await getLicenseRequestsApi()
    if (response.code === 200) {
      licenseRequests.value = response.data
    } else {
      ElMessage.error(response.message || "加载许可证申请列表失败")
    }
  } catch (error) {
    requestErrorMessage.value = "加载许可证申请列表失败，已展示模拟数据。"
    const mockResponse = await getLicenseRequestsMock()
    licenseRequests.value = mockResponse.data
  } finally {
    requestLoading.value = false
  }
}

const fetchList = async () => {
  loading.value = true
  errorMessage.value = ""
  try {
    const response = await getLicenseListApi(query.value)
    if (response.code === 200) {
      licenses.value = response.data.records
      total.value = response.data.total
    } else {
      ElMessage.error(response.message || "加载许可证列表失败")
    }
  } catch (error) {
    errorMessage.value = "加载许可证列表失败，已展示模拟数据。"
    const mockResponse = await getLicenseListMock(query.value)
    licenses.value = mockResponse.data.records
    total.value = mockResponse.data.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  query.value.pageNum = 1
  fetchList()
}

const handleReset = () => {
  query.value = {
    pageNum: 1,
    pageSize: 10,
    licenseNo: "",
    categoryId: "",
    status: ""
  }
  fetchList()
}

const handlePageChange = (page: number) => {
  query.value.pageNum = page
  fetchList()
}

const handleRequestSearch = () => {
  requestQuery.value.pageNum = 1
}

const handleRequestReset = () => {
  requestQuery.value = {
    pageNum: 1,
    pageSize: 10,
    licenseNo: "",
    categoryId: "",
    status: ""
  }
}

const handleView = (licenseId: string) => {
  selectedLicense.value = licenses.value.find((item) => item.licenseId === licenseId) ?? null
  detailVisible.value = true
}

const handleApprove = async (row: LicenseRequestItem) => {
  try {
    await ElMessageBox.confirm("确认同意该申请？", "审批确认", {
      confirmButtonText: "同意",
      cancelButtonText: "取消",
      type: "warning"
    })
  } catch (error) {
    if ((error as Error).message === "cancel") return
    return
  }

  try {
    const response = await approveLicenseRequestApi(row.requestId)
    if (response.code === 200) {
      Object.assign(row, response.data)
      ElMessage.success("已同意申请，请上传许可证文件。")
    } else {
      ElMessage.error(response.message || "审批失败")
    }
  } catch (error) {
    try {
      const mockResponse = await approveLicenseRequestMock(row.requestId)
      Object.assign(row, mockResponse.data)
      ElMessage.success("已同意申请，请上传许可证文件。")
    } catch (mockError) {
      ElMessage.error("审批失败")
    }
  }
}

const handleReject = async (row: LicenseRequestItem) => {
  try {
    await ElMessageBox.confirm("确认拒绝该申请？", "审批确认", {
      confirmButtonText: "拒绝",
      cancelButtonText: "取消",
      type: "warning"
    })
  } catch (error) {
    if ((error as Error).message === "cancel") return
    return
  }

  try {
    const response = await rejectLicenseRequestApi(row.requestId)
    if (response.code === 200) {
      Object.assign(row, response.data)
      ElMessage.success("已拒绝该申请。")
    } else {
      ElMessage.error(response.message || "拒绝失败")
    }
  } catch (error) {
    try {
      const mockResponse = await rejectLicenseRequestMock(row.requestId)
      Object.assign(row, mockResponse.data)
      ElMessage.success("已拒绝该申请。")
    } catch (mockError) {
      ElMessage.error("拒绝失败")
    }
  }
}

const handleUploadRequest = async (row: LicenseRequestItem, options: UploadRequestOptions) => {
  uploadingRequestMap.value[row.requestId] = true
  try {
    const formData = new FormData()
    formData.append("file", options.file)
    const response = await uploadLicenseFileApi(row.requestId, formData)
    if (response.code === 200) {
      Object.assign(row, response.data)
      ElMessage.success("许可证已上传。")
      options.onSuccess?.(response.data, options.file)
    } else {
      ElMessage.error(response.message || "上传失败")
      options.onError?.(new Error(response.message || "upload failed"))
    }
  } catch (error) {
    try {
      const mockResponse = await uploadLicenseFileMock(row.requestId)
      Object.assign(row, mockResponse.data)
      ElMessage.success("许可证已上传。")
      options.onSuccess?.(mockResponse.data, options.file)
    } catch (mockError) {
      ElMessage.error("上传失败")
      options.onError?.(mockError as Error)
    }
  } finally {
    uploadingRequestMap.value[row.requestId] = false
  }
}

onMounted(async () => {
  await fetchCategories()
  await fetchRequests()
  await fetchList()
})
</script>

<template>
  <div class="license-manage-page">
    <div class="page-header">
      <div>
        <h2 class="title">管理员许可证管理</h2>
        <p class="subtitle">审批申请、上传许可证，并查询已分配的许可证。</p>
      </div>
    </div>

    <section class="section-card">
      <div class="section-header">
        <div>
          <h3 class="section-title">许可证申请信息</h3>
          <p class="section-desc">同意后上传第三方许可证文件。</p>
        </div>
      </div>

      <LicenseSearchForm
        v-model="requestQuery"
        :categories="categories"
        :loading="requestLoading"
        :show-license-no="false"
        :status-options="LICENSE_REQUEST_STATUS_OPTIONS"
        status-label="申请状态"
        @search="handleRequestSearch"
        @reset="handleRequestReset"
      />

      <el-alert v-if="requestErrorMessage" :title="requestErrorMessage" type="warning" show-icon class="error-alert" />

      <el-table
        :data="filteredRequests"
        style="width: 100%"
        v-loading="requestLoading"
        row-key="requestId"
        empty-text="暂无申请记录"
      >
        <el-table-column prop="customerName" label="客户名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="macAddress" label="电脑MAC地址" min-width="160" show-overflow-tooltip />
        <el-table-column prop="userName" label="申请人" min-width="120" />
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
            <el-tag :type="getRequestStatusType(row)">
              {{ getRequestStatusLabel(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="许可证编号" min-width="160">
          <template #default="{ row }">{{ row.licenseNo || "-" }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="申请时间" min-width="120" />
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button size="small" type="primary" @click="handleApprove(row)">同意</el-button>
              <el-button size="small" type="danger" @click="handleReject(row)">拒绝</el-button>
            </template>
            <template v-else-if="row.status === 'approved' && !row.licenseNo">
              <el-upload
                :http-request="(options) => handleUploadRequest(row, options)"
                :show-file-list="false"
                :disabled="uploadingRequestMap[row.requestId]"
              >
                <el-button size="small" type="primary" :loading="uploadingRequestMap[row.requestId]">
                  上传许可证
                </el-button>
              </el-upload>
            </template>
            <span v-else class="muted">--</span>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="section-card">
      <div class="section-header">
        <div>
          <h3 class="section-title">已分配的许可证</h3>
          <p class="section-desc">仅支持查询。</p>
        </div>
      </div>

      <LicenseSearchForm
        v-model="query"
        :categories="categories"
        :loading="loading"
        @search="handleSearch"
        @reset="handleReset"
      />

      <el-alert v-if="errorMessage" :title="errorMessage" type="warning" show-icon class="error-alert" />

      <LicenseTable :items="licenses" :loading="loading" :show-disable="false" @view="handleView" />

      <el-pagination
        background
        layout="total, prev, pager, next, jumper"
        :total="total"
        :current-page="query.pageNum"
        :page-size="query.pageSize"
        @current-change="handlePageChange"
        class="pagination"
        :disabled="loading"
      />
    </section>

    <el-dialog v-model="detailVisible" title="许可证定制信息" width="640px">
      <el-descriptions v-if="selectedLicense" :column="2" border>
        <el-descriptions-item label="许可证编号">{{ selectedLicense.licenseNo }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ selectedLicense.userName }}</el-descriptions-item>
        <el-descriptions-item label="模块类别">{{ selectedLicense.categoryName }}</el-descriptions-item>
        <el-descriptions-item label="模块名称">{{ selectedLicense.moduleName }}</el-descriptions-item>
        <el-descriptions-item label="使用期限"
          >{{ selectedLicense.validFrom }} ~ {{ selectedLicense.validTo }}</el-descriptions-item
        >
        <el-descriptions-item label="使用次数">{{ selectedLicense.usageCount }}</el-descriptions-item>
        <el-descriptions-item label="可操作权限">
          <el-tag v-for="item in selectedPermissionLabels" :key="item" type="info" class="permission-tag">
            {{ item }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">{{ selectedLicense.status }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.license-manage-page {
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

.pagination {
  margin-top: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.section-card {
  border: 1px solid #eef2f7;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  background-color: #fff;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  color: #111827;
}

.section-desc {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 13px;
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
