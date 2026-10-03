export type WorkspaceGovernancePolicy = {
  workspaceId: string;
  retentionDays: number;
  backupEnabled: boolean;
  ssoEnabled: boolean;
  updatedAt: string;
};
