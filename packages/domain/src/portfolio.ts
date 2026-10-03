export type PortfolioSummary = {
  projectCount: number;
  activeProjectCount: number;
  workItemCount: number;
  completedWorkItemCount: number;
  openDefectCount: number;
  deliveryRate: number;
};

export type TeamCapacity = {
  memberId: string;
  assignedWorkItems: number;
  completedWorkItems: number;
  loadRate: number;
};
