import { request } from "@/utils/service"
import type {
  ApiResponse,
  PageData,
  ModuleCategory,
  LicenseModule,
  LicenseListQuery,
  LicenseItem,
  LicenseRequestItem,
  LicenseRequestPayload
} from "./types/license"

// TODO: Replace mock usage with real backend endpoints for license categories, modules, list, requests, approvals, uploads, and downloads.

const mockCategories: ModuleCategory[] = [
  { categoryId: "pre", name: "前处理" },
  { categoryId: "solver", name: "求解器" },
  { categoryId: "post", name: "后处理" }
]
const mockModules: LicenseModule[] = [
  { moduleId: "pre-impact", moduleNo: "PRE-IMP-001", name: "冲击", categoryId: "pre" },
  { moduleId: "pre-dynamic", moduleNo: "PRE-DYN-002", name: "动力", categoryId: "pre" },
  { moduleId: "pre-multi", moduleNo: "PRE-MBD-003", name: "多体", categoryId: "pre" },
  { moduleId: "solver-impact", moduleNo: "SOL-IMP-101", name: "冲击", categoryId: "solver" },
  { moduleId: "solver-dynamic", moduleNo: "SOL-DYN-102", name: "动力", categoryId: "solver" },
  { moduleId: "solver-multi", moduleNo: "SOL-MBD-103", name: "多体", categoryId: "solver" },
  { moduleId: "post-general", moduleNo: "POST-GEN-201", name: "通用后处理", categoryId: "post" }
]
const getCategoryName = (categoryId: string) =>
  mockCategories.find((item) => item.categoryId === categoryId)?.name ?? ""

const getModuleInfo = (moduleId: string) => mockModules.find((item) => item.moduleId === moduleId)

const buildRequestItem = (
  requestId: string,
  moduleId: string,
  userName: string,
  customerName: string,
  macAddress: string,
  status: LicenseRequestItem["status"],
  validFrom: string,
  validTo: string,
  usageCount: number,
  permissions: string[],
  createdAt: string,
  licenseNo?: string
): LicenseRequestItem => {
  const moduleInfo = getModuleInfo(moduleId)
  const categoryId = moduleInfo?.categoryId ?? "pre"
  const categoryName = getCategoryName(categoryId)
  return {
    requestId,
    userName,
    customerName,
    macAddress,
    status,
    moduleId,
    moduleName: moduleInfo?.name ?? "",
    categoryId,
    categoryName,
    validFrom,
    validTo,
    usageCount,
    permissions,
    createdAt,
    licenseNo
  }
}

const mockLicenses: LicenseItem[] = [
  {
    licenseId: "lic-001",
    licenseNo: "LIC-2024-001",
    categoryId: "solver",
    categoryName: "求解器",
    moduleId: "solver-impact",
    moduleNo: "SOL-IMP-101",
    moduleName: "冲击",
    validFrom: "2024-06-01",
    validTo: "2025-06-01",
    usageCount: 100,
    permissions: ["view", "run"],
    userName: "张三",
    status: "active",
    createdAt: "2024-06-01",
    expiresAt: "2025-06-01"
  },
  {
    licenseId: "lic-002",
    licenseNo: "LIC-2024-002",
    categoryId: "pre",
    categoryName: "前处理",
    moduleId: "pre-dynamic",
    moduleNo: "PRE-DYN-002",
    moduleName: "动力",
    validFrom: "2024-03-12",
    validTo: "2025-03-12",
    usageCount: 60,
    permissions: ["view", "edit"],
    userName: "李四",
    status: "disabled",
    createdAt: "2024-03-12",
    expiresAt: "2025-03-12"
  },
  {
    licenseId: "lic-003",
    licenseNo: "LIC-2024-003",
    categoryId: "post",
    categoryName: "后处理",
    moduleId: "post-general",
    moduleNo: "POST-GEN-201",
    moduleName: "通用后处理",
    validFrom: "2023-01-05",
    validTo: "2024-01-05",
    usageCount: 30,
    permissions: ["view", "export"],
    userName: "王五",
    status: "expired",
    createdAt: "2023-01-05",
    expiresAt: "2024-01-05"
  }
]
let mockLicenseRequests: LicenseRequestItem[] = [
  buildRequestItem(
    "req-2024-001",
    "solver-impact",
    "张三",
    "华北工业集团",
    "3C:52:82:1A:9F:01",
    "approved",
    "2024-07-01",
    "2025-07-01",
    120,
    ["view", "run"],
    "2024-06-10",
    "LIC-2024-010"
  ),
  buildRequestItem(
    "req-2024-002",
    "pre-dynamic",
    "张三",
    "江南动力科技",
    "8C:7B:9D:2F:11:0A",
    "pending",
    "2024-08-01",
    "2025-08-01",
    80,
    ["view", "edit"],
    "2024-06-16"
  ),
  buildRequestItem(
    "req-2024-003",
    "post-general",
    "李四",
    "东启精工",
    "A4:5E:60:7B:31:9C",
    "rejected",
    "2024-05-01",
    "2024-11-01",
    40,
    ["view", "export"],
    "2024-05-20"
  )
]
const updateRequestItem = (requestId: string, patch: Partial<LicenseRequestItem>): LicenseRequestItem | null => {
  const target = mockLicenseRequests.find((item) => item.requestId === requestId)
  if (!target) return null
  const updated: LicenseRequestItem = { ...target, ...patch }
  mockLicenseRequests = mockLicenseRequests.map((item) => (item.requestId === requestId ? updated : item))
  return updated
}

const successResponse = <T>(data: T): ApiResponse<T> => ({
  code: 200,
  message: "ok",
  data
})

export const getModuleCategoriesMock = async (): Promise<ApiResponse<ModuleCategory[]>> =>
  successResponse(mockCategories)

export const getModulesByCategoryMock = async (categoryId: string): Promise<ApiResponse<LicenseModule[]>> => {
  const data = mockModules.filter((item) => item.categoryId === categoryId)
  return successResponse(data)
}

export const getLicenseListMock = async (query: LicenseListQuery): Promise<ApiResponse<PageData<LicenseItem>>> => {
  const { pageNum, pageSize, licenseNo, categoryId, status } = query
  const filtered = mockLicenses.filter((item) => {
    const matchLicense = licenseNo ? item.licenseNo.includes(licenseNo) : true
    const matchCategory = categoryId ? item.categoryId === categoryId : true
    const matchStatus = status ? item.status === status : true
    return matchLicense && matchCategory && matchStatus
  })
  const start = (pageNum - 1) * pageSize
  const records = filtered.slice(start, start + pageSize)
  return successResponse({
    records,
    total: filtered.length,
    size: pageSize,
    current: pageNum
  })
}

export const getLicenseRequestsMock = async (): Promise<ApiResponse<LicenseRequestItem[]>> =>
  successResponse(mockLicenseRequests)

export const approveLicenseRequestMock = async (
  requestId: string,
  _data?: { remark?: string }
): Promise<ApiResponse<LicenseRequestItem>> => {
  const updated = updateRequestItem(requestId, { status: "approved" })
  if (!updated) return Promise.reject(new Error("license request not found"))
  return successResponse(updated)
}

export const rejectLicenseRequestMock = async (
  requestId: string,
  _data?: { remark?: string }
): Promise<ApiResponse<LicenseRequestItem>> => {
  const updated = updateRequestItem(requestId, { status: "rejected" })
  if (!updated) return Promise.reject(new Error("license request not found"))
  return successResponse(updated)
}

export const uploadLicenseFileMock = async (
  requestId: string,
  data?: FormData
): Promise<ApiResponse<LicenseRequestItem>> => {
  const licenseNoValue = data?.get("licenseNo")
  const licenseNo =
    typeof licenseNoValue === "string" && licenseNoValue.trim() ? licenseNoValue.trim() : `LIC-UP-${Date.now()}`
  const updated = updateRequestItem(requestId, { status: "approved", licenseNo })
  if (!updated) return Promise.reject(new Error("license request not found"))
  return successResponse(updated)
}

export const downloadLicenseFileMock = async (requestId: string): Promise<Blob> => {
  const target = mockLicenseRequests.find((item) => item.requestId === requestId)
  const label = target?.licenseNo ?? requestId
  const content = `Mock license file for ${label}`
  return new Blob([content], { type: "text/plain" })
}

export const createLicenseRequestMock = async (
  payload: LicenseRequestPayload,
  userName = "当前用户"
): Promise<ApiResponse<LicenseRequestItem>> => {
  const moduleInfo = getModuleInfo(payload.moduleId)
  const categoryId = moduleInfo?.categoryId ?? payload.categoryId
  const categoryName = getCategoryName(categoryId)
  const requestId = `req-${Date.now()}`
  const createdAt = new Date().toISOString().slice(0, 10)
  const requestItem: LicenseRequestItem = {
    requestId,
    userName,
    customerName: payload.customerName,
    macAddress: payload.macAddress,
    status: "pending",
    moduleId: payload.moduleId,
    moduleName: moduleInfo?.name ?? "",
    categoryId,
    categoryName,
    validFrom: payload.validFrom,
    validTo: payload.validTo,
    usageCount: payload.usageCount,
    permissions: payload.permissions,
    createdAt
  }
  mockLicenseRequests = [requestItem, ...mockLicenseRequests]
  return successResponse(requestItem)
}

export const getModuleCategoriesApi = () =>
  request<ApiResponse<ModuleCategory[]>>({
    url: "/license/categories",
    method: "get"
  })

export const getModulesByCategoryApi = (categoryId: string) =>
  request<ApiResponse<LicenseModule[]>>({
    url: "/license/modules",
    method: "get",
    params: { categoryId }
  })

export const getLicenseListApi = (query: LicenseListQuery) =>
  request<ApiResponse<PageData<LicenseItem>>>({
    url: "/license/list",
    method: "get",
    params: query
  })

export const getLicenseRequestsApi = (params?: { userName?: string }) =>
  request<ApiResponse<LicenseRequestItem[]>>({
    url: "/license/requests",
    method: "get",
    params
  })

export const createLicenseRequestApi = (payload: LicenseRequestPayload) =>
  request<ApiResponse<LicenseRequestItem>>({
    url: "/license/requests",
    method: "post",
    data: payload
  })

export const approveLicenseRequestApi = (requestId: string, data?: { remark?: string }) =>
  request<ApiResponse<LicenseRequestItem>>({
    url: `/license/requests/${requestId}/approve`,
    method: "post",
    data
  })

export const rejectLicenseRequestApi = (requestId: string, data?: { remark?: string }) =>
  request<ApiResponse<LicenseRequestItem>>({
    url: `/license/requests/${requestId}/reject`,
    method: "post",
    data
  })

export const uploadLicenseFileApi = (requestId: string, data: FormData) =>
  request<ApiResponse<LicenseRequestItem>>({
    url: `/license/requests/${requestId}/upload`,
    method: "post",
    headers: {
      "Content-Type": "multipart/form-data"
    },
    data,
    timeout: 0
  })

export const downloadLicenseFileApi = (requestId: string) =>
  request<Blob>({
    url: `/license/requests/${requestId}/download`,
    method: "get",
    responseType: "blob",
    timeout: 0
  })
