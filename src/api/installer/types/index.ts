interface Component {
  id: number
  name: string
  version: string
  size: string
  description: string
  dynamicsDirection?: string
  moduleType?: string
  resourceType?: string
}

type InstallComponentParams = Pick<Component, "id" | "name" | "dynamicsDirection" | "moduleType" | "resourceType">

interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export type { Component, InstallComponentParams, ApiResponse }
