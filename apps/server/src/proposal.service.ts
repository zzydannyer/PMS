import { Injectable, NotFoundException } from "@nestjs/common";
import {
  type Proposal,
  type ProposalChange,
  type WorkItem,
} from "@pms/domain";
import { transitionProposal as moveProposal } from "@pms/ai-core";

import { DatabaseService } from "./database.service.js";

type CreateProposalInput = {
  workspaceId: string;
  projectId: string;
  requesterId: string;
  message: string;
};

type ConfirmProposalInput = {
  acceptedChangeIds: string[];
};

type WorkItemProposalValue = {
  title: string;
  projectId: string;
  type: string;
  priority: string;
};

@Injectable()
export class ProposalService {
  private readonly proposals = new Map<string, Proposal>();

  public constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateProposalInput): Promise<Proposal> {
    const proposalId = `proposal-${Date.now()}`;
    const changeId = `${proposalId}-change`;
    const change: ProposalChange = {
      id: changeId,
      operation: "CREATE",
      entityType: "WORK_ITEM",
      entityId: `${proposalId}-work-item`,
      field: "workItem",
      after: {
        title: input.message,
        projectId: input.projectId,
        type: "TASK",
        priority: "MEDIUM",
      },
    };
    const now = new Date();
    const proposal: Proposal = {
      id: proposalId,
      workspaceId: input.workspaceId,
      requesterId: input.requesterId,
      intent: "根据用户指令创建工作项",
      status: "WAITING_APPROVAL",
      risk: "LOW",
      changes: [change],
      evidence: [],
      baseVersions: {},
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
    };
    this.proposals.set(proposal.id, proposal);
    await this.databaseService.recordProposalAudit(
      proposal.id,
      proposal.workspaceId,
      proposal.requesterId,
      "CREATED",
      proposal.status,
      proposal.changes.map((change) => change.id),
    );
    return proposal;
  }

  async confirm(
    proposalId: string,
    input: ConfirmProposalInput,
    requesterId: string,
  ): Promise<{ proposal: Proposal; workItem: WorkItem }> {
    const storedProposal = this.proposals.get(proposalId);
    if (!storedProposal) {
      throw new NotFoundException("提议不存在或已过期");
    }
    if (storedProposal.requesterId !== requesterId) {
      throw new NotFoundException("提议不存在或已过期");
    }
    const approvedProposal = moveProposal(
      storedProposal,
      "APPROVED",
    );
    const change = approvedProposal.changes.find((item) =>
      input.acceptedChangeIds.includes(item.id),
    );
    if (!change || change.operation !== "CREATE") {
      throw new NotFoundException("没有可执行的变更");
    }
    await this.databaseService.recordProposalAudit(
      proposalId,
      approvedProposal.workspaceId,
      approvedProposal.requesterId,
      "CONFIRMED",
      approvedProposal.status,
      input.acceptedChangeIds,
    );
    const after = change.after as WorkItemProposalValue;
    const title = after.title;
    const workItem = await this.databaseService.createWorkItem({
      workspaceId: approvedProposal.workspaceId,
      projectId: after.projectId,
      title,
      description: approvedProposal.intent,
      type: "TASK",
      priority: "MEDIUM",
      reporterId: requesterId,
    });
    const executedProposal = moveProposal(approvedProposal, "EXECUTED");
    this.proposals.set(proposalId, executedProposal);
    await this.databaseService.recordProposalAudit(
      proposalId,
      executedProposal.workspaceId,
      executedProposal.requesterId,
      "EXECUTED",
      executedProposal.status,
      input.acceptedChangeIds,
    );
    return {
      proposal: executedProposal,
      workItem,
    };
  }

  list(requesterId: string): Proposal[] {
    return [...this.proposals.values()].filter(
      (proposal) => proposal.requesterId === requesterId,
    );
  }

  async revoke(proposalId: string, requesterId: string): Promise<Proposal> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.requesterId !== requesterId) {
      throw new NotFoundException("提议不存在或已过期");
    }
    const revokedProposal = moveProposal(proposal, "EXPIRED");
    this.proposals.set(proposalId, revokedProposal);
    await this.databaseService.recordProposalAudit(
      proposalId,
      proposal.workspaceId,
      requesterId,
      "REVOKED",
      revokedProposal.status,
      [],
    );
    return revokedProposal;
  }
}
