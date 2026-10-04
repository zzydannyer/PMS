import type {
  Defect,
  DeliveryMetrics,
  AiUsageSummary,
  IntegrationEvent,
  PortfolioSummary,
  WorkspaceGovernancePolicy,
  TeamCapacity,
  Iteration,
  Milestone,
  Project,
  Proposal,
  Release,
  WorkItem,
  WorkItemDependency,
} from "@pms/domain";

export type ApiResponse<Data> = {
  data: Data;
  requestId: string;
};

export type PageResult<Item> = {
  items: Item[];
  nextCursor: string;
  total: number;
};

export type ListProjectsRequest = {
  workspaceId: string;
};

export type ListProjectsResponse = ApiResponse<Project[]>;

export type CreateProjectRequest = {
  workspaceId: string;
  name: string;
  description: string;
  ownerId: string;
};

export type CreateProjectResponse = ApiResponse<Project>;

export type ListWorkItemsRequest = {
  workspaceId: string;
  projectId: string;
};

export type ListWorkItemsResponse = ApiResponse<WorkItem[]>;

export type CreateWorkItemRequest = {
  workspaceId: string;
  projectId: string;
  title: string;
  description: string;
  type: WorkItem["type"];
  priority: WorkItem["priority"];
  reporterId: string;
};

export type CreateWorkItemResponse = ApiResponse<WorkItem>;

export type UpdateWorkItemRequest = {
  status: WorkItem["status"];
  priority: WorkItem["priority"];
  assigneeId: string;
  dueDate: string;
};

export type UpdateWorkItemResponse = ApiResponse<WorkItem>;

export type ListDeliveryRequest = {
  projectId: string;
};

export type CreateIterationRequest = {
  projectId: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
};

export type CreateIterationResponse = ApiResponse<Iteration>;

export type CreateMilestoneRequest = {
  projectId: string;
  name: string;
  description: string;
  dueDate: string;
};

export type CreateMilestoneResponse = ApiResponse<Milestone>;

export type ListDeliveryResponse = ApiResponse<{
  iterations: Iteration[];
  milestones: Milestone[];
  releases: Release[];
  defects: Defect[];
}>;

export type DeliveryMetricsResponse = ApiResponse<DeliveryMetrics>;

export type IntegrationEventResponse = ApiResponse<IntegrationEvent>;

export type AiUsageSummaryResponse = ApiResponse<AiUsageSummary>;

export type PortfolioSummaryResponse = ApiResponse<PortfolioSummary>;
export type AiAuditRecord = {
  id: string;
  proposalId: string;
  workspaceId: string;
  requesterId: string;
  action: string;
  status: string;
  changes: string[];
  createdAt: string;
};
export type AiAuditRecordsResponse = ApiResponse<AiAuditRecord[]>;
export type WorkspaceGovernancePolicyResponse =
  ApiResponse<WorkspaceGovernancePolicy>;
export type TeamCapacityResponse = ApiResponse<TeamCapacity[]>;

export type WorkItemDependencyResponse = ApiResponse<WorkItemDependency>;
export type WorkItemDependenciesResponse = ApiResponse<WorkItemDependency[]>;

export type AskAgentRequest = {
  workspaceId: string;
  projectId: string;
  conversationId: string;
  message: string;
};

export type AgentCitation = {
  entityType: string;
  entityId: string;
  title: string;
};

export type AgentAnswer = {
  runId: string;
  conversationId: string;
  answer: string;
  citations: AgentCitation[];
  hasProposal: false;
};

export type AgentProposalAnswer = {
  runId: string;
  conversationId: string;
  answer: string;
  citations: AgentCitation[];
  proposal: Proposal;
  hasProposal: true;
};

export type AskAgentResponse = ApiResponse<AgentAnswer | AgentProposalAnswer>;

export type ConfirmProposalRequest = {
  proposalId: string;
  confirmationToken: string;
  acceptedChangeIds: string[];
};

export type ConfirmProposalResponse = ApiResponse<{
  proposal: Proposal;
}>;

export type RealtimeEvent = {
  event: "PROJECT_CHANGED" | "WORK_ITEM_CHANGED" | "COMMENT_ADDED" | "NOTIFICATION_CHANGED";
  entityId: string;
  occurredAt: string;
};

export type PmsApi = {
  listProjects: (request: ListProjectsRequest) => Promise<ListProjectsResponse>;
  createProject: (
    request: CreateProjectRequest,
  ) => Promise<CreateProjectResponse>;
  listWorkItems: (request: ListWorkItemsRequest) => Promise<ListWorkItemsResponse>;
  createWorkItem: (
    request: CreateWorkItemRequest,
  ) => Promise<CreateWorkItemResponse>;
  updateWorkItem: (
    workItemId: string,
    request: UpdateWorkItemRequest,
  ) => Promise<UpdateWorkItemResponse>;
  createIteration: (
    projectId: string,
    request: CreateIterationRequest,
  ) => Promise<CreateIterationResponse>;
  createMilestone: (
    projectId: string,
    request: CreateMilestoneRequest,
  ) => Promise<CreateMilestoneResponse>;
  askAgent: (request: AskAgentRequest) => Promise<AskAgentResponse>;
  confirmProposal: (
    request: ConfirmProposalRequest,
  ) => Promise<ConfirmProposalResponse>;
  subscribeRealtime: (
    onEvent: (event: RealtimeEvent) => void,
  ) => () => void;
};
