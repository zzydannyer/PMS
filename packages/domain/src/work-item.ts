export type WorkItemType = "REQUIREMENT" | "TASK" | "BUG" | "SUBTASK";

export type WorkItemStatus = "BACKLOG" | "READY" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED";

export type WorkItemPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

export type WorkItem = {
  id: string;
  workspaceId: string;
  projectId: string;
  parentId: string;
  iterationId: string;
  title: string;
  description: string;
  type: WorkItemType;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  assigneeId: string;
  reporterId: string;
  estimatePoints: number;
  dueDate: string;
  labelIds: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type WorkItemDependencyType = "BLOCKS" | "RELATES_TO" | "DUPLICATES";

export type WorkItemDependency = {
  sourceId: string;
  targetId: string;
  type: WorkItemDependencyType;
  createdAt: string;
};
