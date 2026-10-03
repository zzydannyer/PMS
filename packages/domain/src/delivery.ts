export type IterationStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

export type Iteration = {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  status: IterationStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
};

export type MilestoneStatus = "PLANNED" | "AT_RISK" | "COMPLETED";

export type Milestone = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: MilestoneStatus;
  dueDate: string;
  createdAt: string;
};

export type ReleaseStatus = "PLANNED" | "IN_PROGRESS" | "RELEASED";

export type Release = {
  id: string;
  projectId: string;
  name: string;
  version: string;
  status: ReleaseStatus;
  releaseDate: string;
  createdAt: string;
};

export type DefectSeverity = "CRITICAL" | "MAJOR" | "MINOR" | "TRIVIAL";

export type Defect = {
  id: string;
  workItemId: string;
  severity: DefectSeverity;
  environment: string;
  reproduction: string;
  resolvedAt: string;
};

export type DeliveryMetrics = {
  totalWorkItems: number;
  completedWorkItems: number;
  openDefects: number;
  activeIterations: number;
  releasedVersions: number;
  completionRate: number;
};

export type AiUsageSummary = {
  requestCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};
