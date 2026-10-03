export type ProjectStatus = "PLANNING" | "ACTIVE" | "AT_RISK" | "BLOCKED" | "COMPLETED" | "ARCHIVED";

export type ProjectVisibility = "WORKSPACE" | "PRIVATE";

export type Project = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  ownerId: string;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  startDate: string;
  targetDate: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ProjectMemberRole = "OWNER" | "MANAGER" | "MEMBER" | "VIEWER";

export type ProjectMember = {
  projectId: string;
  memberId: string;
  role: ProjectMemberRole;
  joinedAt: string;
};
