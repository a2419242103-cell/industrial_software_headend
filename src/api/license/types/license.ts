export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PageData<T> {
  records: T[]
  total: number
  size: number
  current: number
}

export interface ModuleCategory {
  categoryId: string
  name: string
  description?: string
}

export interface LicenseModule {
  moduleId: string
  moduleNo: string
  name: string
  description?: string
  categoryId: string
}

export interface ModuleParams {
  validDateRange: [string, string] | null
  usageCount: number | null
  permissions: string[]
}

export interface LicenseModuleConfig {
  moduleId: string
  validFrom: string
  validTo: string
  usageCount: number
  permissions: string[]
}

export interface LicenseDetail {
  licenseId: string
  licenseNo: string
  modules: LicenseModuleConfig[]
  status: string
  createdAt: string
  expiresAt: string
}

export interface LicenseSavePayload {
  licenseId?: string
  modules: LicenseModuleConfig[]
}

export interface LicenseSaveResult {
  licenseId: string
  licenseNo: string
}

export interface LicenseRequestPayload {
  customerName: string
  macAddress: string
  categoryId: string
  moduleId: string
  validFrom: string
  validTo: string
  usageCount: number
  permissions: string[]
}

export interface LicenseRequestItem extends LicenseRequestPayload {
  requestId: string
  userName: string
  categoryName: string
  moduleName: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  licenseNo?: string
}

export interface LicenseListQuery {
  pageNum: number
  pageSize: number
  licenseNo?: string
  categoryId?: string
  status?: string
}

export interface LicenseItem {
  licenseId: string
  licenseNo: string
  categoryId: string
  categoryName: string
  moduleId: string
  moduleNo: string
  moduleName: string
  validFrom: string
  validTo: string
  usageCount: number
  permissions: string[]
  userName: string
  status: string
  createdAt: string
  expiresAt: string
}
