interface Server {
  id: number
  name: string
  ip: string
  type: string
  status: "running" | "idle" | "offline" | "maintenance"
  cpuCores: number
  memory: number
  cpuUsage: number
  memoryUsage: number
  lastOnline: string
}

interface Task {
  id: number
  name: string
  serverId: number
  serverName: string
  type: string
  priority: number
  cpuCoreNeed: number
  memoryNeed: number
  progress: number
  status: string
  startTime: string
}

interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

interface PageData<T> {
  total: number
  records: T[]
}

export type { Task, Server, ApiResponse, PageData }
