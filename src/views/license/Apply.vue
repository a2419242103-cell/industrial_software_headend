<script setup lang="ts">
import { onMounted, ref } from "vue"
import { ElMessage } from "element-plus"
import type { FormInstance } from "element-plus"
import type { LicenseModule, LicenseRequestPayload, ModuleCategory } from "@/api/license/types/license"
import {
  createLicenseRequestApi,
  createLicenseRequestMock,
  getModuleCategoriesApi,
  getModuleCategoriesMock,
  getModulesByCategoryApi,
  getModulesByCategoryMock
} from "@/api/license"
import { LICENSE_PERMISSIONS } from "@/constants/license"
import { useUserStoreHook } from "@/store/modules/user"

const userStore = useUserStoreHook()

const dialogVisible = ref(false)
const loading = ref(false)
const moduleLoading = ref(false)
const categories = ref<ModuleCategory[]>([])
const modules = ref<LicenseModule[]>([])
const formRef = ref<FormInstance>()
const form = ref({
  categoryId: "",
  moduleId: "",
  validDateRange: [] as string[],
  usageCount: 1,
  permissions: [] as string[]
})

const rules = {
  categoryId: [{ required: true, message: "请选择模块类别", trigger: "change" }],
  moduleId: [{ required: true, message: "请选择模块名称", trigger: "change" }],
  validDateRange: [{ type: "array", required: true, message: "请选择使用期限", trigger: "change" }],
  usageCount: [{ required: true, message: "请输入使用次数", trigger: "blur" }],
  permissions: [{ type: "array", required: true, message: "请选择权限", trigger: "change" }]
}

const fetchCategories = async () => {
  try {
    const response = await getModuleCategoriesApi()
    if (response.code === 200) {
      categories.value = response.data
    } else {
      ElMessage.error(response.message || "加载模块类别失败")
    }
  } catch (error) {
    const mockResponse = await getModuleCategoriesMock()
    categories.value = mockResponse.data
  }
}

const fetchModules = async (categoryId: string) => {
  if (!categoryId) {
    modules.value = []
    return
  }
  moduleLoading.value = true
  try {
    const response = await getModulesByCategoryApi(categoryId)
    if (response.code === 200) {
      modules.value = response.data
    } else {
      ElMessage.error(response.message || "加载模块列表失败")
    }
  } catch (error) {
    const mockResponse = await getModulesByCategoryMock(categoryId)
    modules.value = mockResponse.data
  } finally {
    moduleLoading.value = false
  }
}

const handleCategoryChange = async (categoryId: string) => {
  form.value.moduleId = ""
  await fetchModules(categoryId)
}

const resetForm = () => {
  formRef.value?.resetFields()
  modules.value = []
}

const handleSubmit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  const [validFrom, validTo] = form.value.validDateRange
  const payload: LicenseRequestPayload = {
    categoryId: form.value.categoryId,
    moduleId: form.value.moduleId,
    validFrom,
    validTo,
    usageCount: form.value.usageCount,
    permissions: form.value.permissions
  }
  try {
    const response = await createLicenseRequestApi(payload)
    if (response.code === 200) {
      ElMessage.success("许可证申请已提交")
    } else {
      ElMessage.error(response.message || "提交申请失败")
      return
    }
  } catch (error) {
    await createLicenseRequestMock(payload, userStore.username || "当前用户")
    ElMessage.success("已使用本地模拟数据提交申请")
  } finally {
    loading.value = false
  }

  dialogVisible.value = false
  resetForm()
}

onMounted(fetchCategories)
</script>

<template>
  <div class="license-request-page">
    <div class="page-header">
      <div>
        <h2 class="title">许可证申请</h2>
        <p class="subtitle">填写模块与使用权限，提交后等待管理员审批。</p>
      </div>
      <el-button type="primary" @click="dialogVisible = true">申请许可证</el-button>
    </div>

    <el-alert
      title="申请信息将用于生成许可证，请确保模块、使用期限与权限填写准确。"
      type="info"
      show-icon
      class="info-alert"
      :closable="false"
    />

    <el-dialog v-model="dialogVisible" title="申请许可证" width="560px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="模块类别" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择模块类别" @change="handleCategoryChange">
            <el-option v-for="item in categories" :key="item.categoryId" :label="item.name" :value="item.categoryId" />
          </el-select>
        </el-form-item>
        <el-form-item label="模块名称" prop="moduleId">
          <el-select
            v-model="form.moduleId"
            placeholder="请选择模块名称"
            :loading="moduleLoading"
            :disabled="!form.categoryId"
          >
            <el-option v-for="item in modules" :key="item.moduleId" :label="item.name" :value="item.moduleId" />
          </el-select>
        </el-form-item>
        <el-form-item label="使用期限" prop="validDateRange">
          <el-date-picker
            v-model="form.validDateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="~"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item label="使用次数" prop="usageCount">
          <el-input-number v-model="form.usageCount" :min="1" :step="1" controls-position="right" />
        </el-form-item>
        <el-form-item label="权限" prop="permissions">
          <el-checkbox-group v-model="form.permissions">
            <el-checkbox v-for="item in LICENSE_PERMISSIONS" :key="item.value" :label="item.value">
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.license-request-page {
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

.info-alert {
  margin-bottom: 16px;
}
</style>
