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
import LicenseSearchForm from "./components/LicenseSearchForm.vue"
import LicenseTable from "./components/LicenseTable.vue"
import type { LicenseItem, LicenseListQuery, ModuleCategory } from "@/api/license/types/license"
import { LICENSE_PERMISSIONS } from "@/constants/license"
import {
  getLicenseListApi,
  getLicenseListMock,
  getModuleCategoriesApi,
  getModuleCategoriesMock,
  disableLicenseApi,
  disableLicenseMock
} from "@/api/license"

const categories = ref<ModuleCategory[]>([])
const query = ref<LicenseListQuery>({
  pageNum: 1,
  pageSize: 10,
  licenseNo: "",
  categoryId: "",
  status: ""
})
const licenses = ref<LicenseItem[]>([])
const total = ref(0)
const loading = ref(false)
const errorMessage = ref("")
const detailVisible = ref(false)
const selectedLicense = ref<LicenseItem | null>(null)

const permissionLabelMap = computed(() =>
  LICENSE_PERMISSIONS.reduce<Record<string, string>>((acc, item) => {
    acc[item.value] = item.label
    return acc
  }, {})
)

const selectedPermissionLabels = computed(() => {
  if (!selectedLicense.value) return []
  return selectedLicense.value.permissions.map((item) => permissionLabelMap.value[item] || item)
})

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

const handleView = (licenseId: string) => {
  selectedLicense.value = licenses.value.find((item) => item.licenseId === licenseId) ?? null
  detailVisible.value = true
}

const handleDisable = async (licenseId: string) => {
  try {
    await ElMessageBox.confirm("确认停用该许可证？", "确认", {
      confirmButtonText: "停用",
      cancelButtonText: "取消",
      type: "warning"
    })
    const response = await disableLicenseApi(licenseId)
    if (response.code === 200) {
      ElMessage.success("许可证已停用。")
      fetchList()
    } else {
      ElMessage.error(response.message || "停用许可证失败。")
    }
  } catch (error) {
    if ((error as Error).message === "cancel") return
    await disableLicenseMock(licenseId)
    ElMessage.success("已使用本地模拟数据停用许可证。")
    fetchList()
  }
}

onMounted(async () => {
  await fetchCategories()
  await fetchList()
})
</script>

<template>
  <div class="license-manage-page">
    <div class="page-header">
      <div>
        <h2 class="title">许可证管理</h2>
        <p class="subtitle">查询与停用许可证。</p>
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

    <LicenseTable :items="licenses" :loading="loading" @view="handleView" @disable="handleDisable" />

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

.error-alert {
  margin-bottom: 16px;
}

.permission-tag {
  margin-right: 6px;
}
</style>
