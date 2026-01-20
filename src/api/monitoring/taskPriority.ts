import { request } from "@/utils/service"

export type TaskPriority = "high" | "medium" | "low"

export interface UpdateTaskPriorityResponse {
  code: number
  message: string
}

export function updateTaskPriorityApi(taskId: string, priority: TaskPriority) {
  return request<UpdateTaskPriorityResponse>({
    url: `/tasks/${taskId}/priority`,
    method: "put",
    data: { priority }
  })
}
