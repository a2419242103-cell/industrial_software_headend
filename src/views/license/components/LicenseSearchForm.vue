<script setup lang="ts">
import { reactive, watch, withDefaults } from "vue"
import { ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElButton } from "element-plus"
import type { LicenseListQuery, ModuleCategory } from "@/api/license/types/license"
import { LICENSE_STATUS_OPTIONS } from "@/constants/license"

const props = withDefaults(
  defineProps<{
    modelValue: LicenseListQuery
    categories: ModuleCategory[]
    loading: boolean
    showLicenseNo?: boolean
    statusOptions?: { label: string; value: string }[]
    statusLabel?: string
  }>(),
  {
    showLicenseNo: true,
    statusOptions: () => LICENSE_STATUS_OPTIONS,
    statusLabel: "使用状态"
  }
)

const emit = defineEmits<{
  (e: "update:modelValue", value: LicenseListQuery): void
  (e: "search"): void
  (e: "reset"): void
}>()

const localQuery = reactive<LicenseListQuery>({
  pageNum: props.modelValue.pageNum,
  pageSize: props.modelValue.pageSize,
  licenseNo: props.modelValue.licenseNo ?? "",
  categoryId: props.modelValue.categoryId ?? "",
  status: props.modelValue.status ?? ""
})

watch(
  () => props.modelValue,
  (val) => {
    localQuery.pageNum = val.pageNum
    localQuery.pageSize = val.pageSize
    localQuery.licenseNo = val.licenseNo ?? ""
    localQuery.categoryId = val.categoryId ?? ""
    localQuery.status = val.status ?? ""
  },
  { deep: true }
)

watch(
  localQuery,
  () => {
    emit("update:modelValue", {
      pageNum: localQuery.pageNum,
      pageSize: localQuery.pageSize,
      licenseNo: localQuery.licenseNo || undefined,
      categoryId: localQuery.categoryId || undefined,
      status: localQuery.status || undefined
    })
  },
  { deep: true }
)

const handleReset = () => {
  localQuery.licenseNo = ""
  localQuery.categoryId = ""
  localQuery.status = ""
  emit("reset")
}
</script>

<template>
  <el-form class="search-form" inline label-width="110px">
    <el-form-item v-if="props.showLicenseNo" label="许可证编号">
      <el-input v-model="localQuery.licenseNo" placeholder="请输入许可证编号" clearable />
    </el-form-item>
    <el-form-item label="模块类别">
      <el-select v-model="localQuery.categoryId" placeholder="请选择模块类别" clearable style="width: 180px">
        <el-option
          v-for="item in props.categories"
          :key="item.categoryId"
          :label="item.name"
          :value="item.categoryId"
        />
      </el-select>
    </el-form-item>
    <el-form-item :label="props.statusLabel">
      <el-select v-model="localQuery.status" placeholder="请选择状态" clearable style="width: 160px">
        <el-option v-for="item in props.statusOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" :loading="props.loading" @click="emit('search')">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">
.search-form {
  margin-bottom: 16px;
  width: 100%;
}
</style>
