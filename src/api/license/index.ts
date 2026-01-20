import { request } from "@/utils/service"
import type {
  ApiResponse,
  PageData,
  ModuleCategory,
  LicenseModule,
  LicenseDetail,
  LicenseListQuery,
  LicenseItem,
  LicenseSavePayload,
  LicenseSaveResult,
  LicenseRequestItem,
  LicenseRequestPayload
} from "./types/license"

// TODO: Replace mock usage with real backend endpoints for license categories, modules, list, detail, save, and disable.

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

let mockLicenses: LicenseItem[] = [
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
    "rejected",
    "2024-05-01",
    "2024-11-01",
    40,
    ["view", "export"],
    "2024-05-20"
  )
]

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

export const getLicenseDetailMock = async (licenseId: string): Promise<ApiResponse<LicenseDetail>> => {
  const target = mockLicenses.find((item) => item.licenseId === licenseId)
  const moduleId = target?.moduleId ?? mockModules[0]?.moduleId ?? ""
  const validFrom = target?.validFrom ?? "2024-06-01"
  const validTo = target?.validTo ?? "2025-06-01"
  const detail: LicenseDetail = {
    licenseId,
    licenseNo: target?.licenseNo ?? "LIC-NEW",
    status: target?.status ?? "active",
    createdAt: target?.createdAt ?? validFrom,
    expiresAt: target?.expiresAt ?? validTo,
    modules: [
      {
        moduleId,
        validFrom,
        validTo,
        usageCount: target?.usageCount ?? 100,
        permissions: target?.permissions ?? ["view", "run"]
      }
    ]
  }
  return successResponse(detail)
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

export const saveLicenseMock = async (payload: LicenseSavePayload): Promise<ApiResponse<LicenseSaveResult>> => {
  const licenseId = payload.licenseId ?? `lic-${Date.now()}`
  const licenseNo = payload.licenseId ? `LIC-UPDATED-${payload.licenseId}` : `LIC-${Date.now()}`
  const moduleConfig = payload.modules[0]
  const moduleInfo = moduleConfig ? getModuleInfo(moduleConfig.moduleId) : undefined
  const categoryId = moduleInfo?.categoryId ?? "pre"
  const categoryName = getCategoryName(categoryId)
  const existing = mockLicenses.find((item) => item.licenseId === licenseId)
  const userName = existing?.userName ?? "管理员"
  const updatedLicense: LicenseItem = {
    licenseId,
    licenseNo,
    categoryId,
    categoryName,
    moduleId: moduleInfo?.moduleId ?? "pre-impact",
    moduleNo: moduleInfo?.moduleNo ?? "PRE-IMP-001",
    moduleName: moduleInfo?.name ?? "冲击",
    validFrom: moduleConfig?.validFrom ?? "2024-09-01",
    validTo: moduleConfig?.validTo ?? "2025-09-01",
    usageCount: moduleConfig?.usageCount ?? 100,
    permissions: moduleConfig?.permissions ?? ["view"],
    userName,
    status: existing?.status ?? "active",
    createdAt: existing?.createdAt ?? "2024-09-01",
    expiresAt: existing?.expiresAt ?? "2025-09-01"
  }

  if (!payload.licenseId) {
    mockLicenses = [updatedLicense, ...mockLicenses]
  } else {
    mockLicenses = mockLicenses.map((item) => (item.licenseId === licenseId ? updatedLicense : item))
  }
  return successResponse({ licenseId, licenseNo })
}

export const disableLicenseMock = async (licenseId: string): Promise<ApiResponse<void>> => {
  mockLicenses = mockLicenses.map((item) => (item.licenseId === licenseId ? { ...item, status: "disabled" } : item))
  return successResponse(undefined)
}

export const getLicenseRequestsMock = async (): Promise<ApiResponse<LicenseRequestItem[]>> =>
  successResponse(mockLicenseRequests)

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

export const getLicenseDetailApi = (licenseId: string) =>
  request<ApiResponse<LicenseDetail>>({
    url: `/license/${licenseId}`,
    method: "get"
  })

export const saveLicenseApi = (payload: LicenseSavePayload) =>
  request<ApiResponse<LicenseSaveResult>>({
    url: "/license",
    method: "post",
    data: payload
  })

export const generateLicenseApi = (payload: LicenseSavePayload) =>
  request<ApiResponse<LicenseSaveResult>>({
    url: "/license/generate",
    method: "post",
    data: payload
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

export const disableLicenseApi = (licenseId: string) =>
  request<ApiResponse<void>>({
    url: `/license/${licenseId}/disable`,
    method: "post"
  })
