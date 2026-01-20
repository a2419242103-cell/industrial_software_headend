<script setup lang="ts">
import { ElTable, ElTableColumn, ElButton, ElTag } from "element-plus"
import type { LicenseItem } from "@/api/license/types/license"
import { LICENSE_PERMISSIONS } from "@/constants/license"

const props = defineProps<{
  items: LicenseItem[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: "view", licenseId: string): void
  (e: "disable", licenseId: string): void
}>()

const statusTypeMap: Record<string, "success" | "info" | "warning" | "danger"> = {
  active: "success",
  disabled: "info",
  expired: "warning"
}

const statusLabelMap: Record<string, string> = {
  active: "启用",
  disabled: "停用",
  expired: "已过期"
}

const permissionLabelMap = LICENSE_PERMISSIONS.reduce<Record<string, string>>((acc, item) => {
  acc[item.value] = item.label
  return acc
}, {})
</script>

<template>
  <el-table
    :data="props.items"
    :style="{ width: '100%' }"
    v-loading="props.loading"
    row-key="licenseId"
    empty-text="暂无许可证"
  >
    <el-table-column prop="licenseNo" label="许可证编号" min-width="160" show-overflow-tooltip />
    <el-table-column prop="userName" label="用户" min-width="120" />
    <el-table-column prop="categoryName" label="模块类别" min-width="120" />
    <el-table-column prop="moduleName" label="模块名称" min-width="120" />
    <el-table-column label="使用期限" min-width="200">
      <template #default="{ row }">{{ row.validFrom }} ~ {{ row.validTo }}</template>
    </el-table-column>
    <el-table-column prop="usageCount" label="使用次数" width="110" />
    <el-table-column label="可操作权限" min-width="200">
      <template #default="{ row }">
        <el-tag v-for="item in row.permissions" :key="item" type="info" class="permission-tag">
          {{ permissionLabelMap[item] || item }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column label="状态" width="120">
      <template #default="{ row }">
        <el-tag :type="statusTypeMap[row.status] || 'info'">
          {{ statusLabelMap[row.status] || row.status }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column label="操作" width="220">
      <template #default="{ row }">
        <el-button size="small" @click="emit('view', row.licenseId)">查询</el-button>
        <el-button size="small" type="danger" @click="emit('disable', row.licenseId)">停用</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped lang="scss">
.permission-tag {
  margin-right: 6px;
}
</style>
