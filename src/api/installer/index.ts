import { request } from "@/utils/service"
import type { ApiResponse, Component, InstallComponentParams } from "@/api/installer/types"

// 获取组件列表
const getComponents = () => {
  return request<ApiResponse<Component[]>>({
    url: "/api/components",
    method: "get"
  })
}

const installComponent = (data: InstallComponentParams) => {
  return request<ApiResponse<void>>({
    url: "/api/components/install",
    method: "post",
    data
  })
}

export { getComponents, installComponent }
