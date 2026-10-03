export type ProposalStatus = "DRAFT" | "WAITING_APPROVAL" | "APPROVED" | "REJECTED" | "EXECUTED" | "FAILED" | "EXPIRED";

export type ProposalRisk = "LOW" | "MEDIUM" | "HIGH";

export type ProposalValue =
  | string
  | number
  | boolean
  | ProposalValue[]
  | { [key: string]: ProposalValue };

export type CreateProposalChange = {
  id: string;
  operation: "CREATE";
  entityType: string;
  entityId: string;
  field: string;
  after: ProposalValue;
};

export type UpdateProposalChange = {
  id: string;
  operation: "UPDATE";
  entityType: string;
  entityId: string;
  field: string;
  before: ProposalValue;
  after: ProposalValue;
};

export type DeleteProposalChange = {
  id: string;
  operation: "DELETE";
  entityType: string;
  entityId: string;
  field: string;
  before: ProposalValue;
};

export type ProposalChange =
  | CreateProposalChange
  | UpdateProposalChange
  | DeleteProposalChange;

export type ProposalEvidence = {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  excerpt: string;
};

export type Proposal = {
  id: string;
  workspaceId: string;
  requesterId: string;
  intent: string;
  status: ProposalStatus;
  risk: ProposalRisk;
  changes: ProposalChange[];
  evidence: ProposalEvidence[];
  baseVersions: Record<string, number>;
  createdAt: string;
  expiresAt: string;
};
