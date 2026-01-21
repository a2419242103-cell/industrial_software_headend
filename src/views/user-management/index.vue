<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import {
  ElTable,
  ElTableColumn,
  ElButton,
  ElInput,
  ElDialog,
  ElForm,
  ElFormItem,
  ElMessageBox,
  ElMessage,
  ElPagination
} from "element-plus"
import type { FormInstance, FormRules } from "element-plus"
import { getPageUsersApi, updateUserInfoApi, deleteUserApi, resetPasswordApi } from "@/api/userManagement/index"
import type { User } from "@/api/userManagement/types/userManagement"

// 用户数据
const userData = ref<User[]>([])
const totalUsers = ref(0)
const currentPage = ref(1)
const pageSize = ref(10) // 固定每页显示数量
const searchQuery = ref("")
const dialogVisible = ref(false)
const userFormRef = ref<FormInstance>()
const isLoading = ref(false) // 添加加载状态
const paginationKey = ref(0) // 新增：用于强制分页组件重新渲染

// 用户表单数据
const userForm = reactive({
  userId: 0,
  username: "",
  phone: ""
})

// 表单验证规则
const validateName = (_: any, value: string, callback: any) => {
  if (!value) {
    return callback(new Error("用户名不能为空"))
  }
  callback()
}

const validatePhone = (_: any, value: string, callback: any) => {
  const phoneRegex = /^1\d{10}$/
  if (!value) {
    return callback(new Error("手机号不能为空"))
  } else if (!phoneRegex.test(value)) {
    return callback(new Error("请输入正确的手机号格式"))
  }
  callback()
}

const rules = reactive<FormRules<typeof userForm>>({
  username: [{ validator: validateName, trigger: "blur" }],
  phone: [{ validator: validatePhone, trigger: "blur" }]
})

// 获取分页用户数据
const fetchUsers = async (forceUpdate = false) => {
  if (isLoading.value && !forceUpdate) return

  isLoading.value = true
  console.log(`Fetching page ${currentPage.value} with pageSize ${pageSize.value}`)

  try {
    const response = await getPageUsersApi({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchQuery.value
    })

    console.log("API response:", response)
    if (response.code === 200) {
      userData.value = response.data.records
      totalUsers.value = response.data.total
      console.log(`Loaded ${userData.value.length} users for page ${currentPage.value}`)

      // 数据更新后强制分页组件重新渲染
      paginationKey.value++
    } else {
      ElMessage.error(response.message || "获取用户列表失败")
    }
  } catch (error) {
    console.error("Error fetching users:", error)
    ElMessage.error("获取用户列表失败，请重试")
  } finally {
    isLoading.value = false
  }
}

// 修改用户信息
const editUserInfo = (row: User) => {
  userForm.userId = row.userId
  userForm.username = row.username
  userForm.phone = row.phone
  dialogVisible.value = true
}

// 提交修改用户表单
const handleUpdateUser = async () => {
  if (!userFormRef.value) return
  userFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await updateUserInfoApi(userForm.userId, {
          username: userForm.username,
          phone: userForm.phone
        })

        if (response.code === 200) {
          const index = userData.value.findIndex((u) => u.userId === userForm.userId)
          if (index !== -1) {
            userData.value[index] = { ...userData.value[index], ...userForm }
          }
          ElMessage.success("修改成功")
          dialogVisible.value = false
        } else {
          ElMessage.error(response.message || "修改失败")
        }
      } catch (error) {
        console.error("修改用户失败:", error)
        ElMessage.error("修改失败，请重试")
      }
    }
  })
}

// 删除用户
const deleteUser = (row: User) => {
  ElMessageBox.confirm("此操作将永久删除该用户, 是否继续?", "警告", {
    confirmButtonText: "删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        const response = await deleteUserApi(row.userId)
        if (response.code === 200) {
          // 删除后重新加载当前页数据
          await fetchUsers(true)
          ElMessage.success("删除成功")
        } else {
          ElMessage.error(response.message || "删除失败")
        }
      } catch (error) {
        console.error("删除用户失败:", error)
        ElMessage.error("删除失败，请重试")
      }
    })
    .catch(() => {})
}

// 重置用户密码
const resetPassword = async (row: User) => {
  try {
    await ElMessageBox.confirm("确定要重置该用户密码吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    const response = await resetPasswordApi(row.userId)
    if (response.code === 200) {
      ElMessage.success("重置密码成功，默认密码为：123456")
    } else {
      ElMessage.error(response.message || "重置密码失败")
    }
  } catch (error) {
    if ((error as Error).message !== "cancel") {
      console.error("重置密码失败:", error)
      ElMessage.error("重置密码失败，请重试")
    }
  }
}

// 分页处理 - 切换页码
const handleCurrentChange = (newPage: number) => {
  if (currentPage.value === newPage) return // 防止重复请求

  console.log(`Page changed from ${currentPage.value} to ${newPage}`)
  currentPage.value = newPage
  fetchUsers()
}

// 搜索功能
const handleSearch = () => {
  currentPage.value = 1 // 搜索时重置到第一页
  fetchUsers()
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="user-page">
    <div class="header">
      <div class="search-container">
        <el-input v-model="searchQuery" placeholder="请输入用户名" class="search-input" @keyup.enter="handleSearch" />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>
    </div>

    <el-table :data="userData" style="width: 100%">
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column label="操作" width="320">
        <template #default="{ row }">
          <el-button size="small" @click="editUserInfo(row)">修改</el-button>
          <el-button size="small" type="danger" @click="deleteUser(row)">删除</el-button>
          <el-button size="small" type="warning" @click="resetPassword(row)">重置密码</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <el-pagination
      :key="paginationKey"
      background
      layout="total, prev, pager, next, jumper"
      :total="totalUsers"
      :current-page="currentPage"
      :page-size="pageSize"
      @current-change="handleCurrentChange"
      class="pagination"
      :disabled="isLoading"
    />

    <el-dialog title="修改用户信息" v-model="dialogVisible" width="500px">
      <el-form ref="userFormRef" :model="userForm" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateUser">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.user-page {
  padding: 20px;
  background-color: #fff;
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
}

.header {
  margin-bottom: 20px;
}

.search-container {
  display: flex;
  gap: 10px;
  width: 400px;
}

.pagination {
  margin-top: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.el-table {
  margin: 20px 0;
  flex-grow: 1;
}
</style>
