import { describe, expect, it } from "vitest";
import type { Proposal } from "@pms/domain";

import {
  canTransitionProposal,
  createProposalExecutionKey,
  selectProposalChanges,
  transitionProposal,
} from "../src";

const proposal: Proposal = {
  id: "proposal-1",
  workspaceId: "workspace-1",
  requesterId: "member-1",
  intent: "将两个任务移动到进行中",
  status: "WAITING_APPROVAL",
  risk: "LOW",
  changes: [
    {
      id: "change-2",
      operation: "UPDATE",
      entityType: "WORK_ITEM",
      entityId: "work-2",
      field: "status",
      before: "READY",
      after: "IN_PROGRESS",
    },
    {
      id: "change-1",
      operation: "UPDATE",
      entityType: "WORK_ITEM",
      entityId: "work-1",
      field: "status",
      before: "READY",
      after: "IN_PROGRESS",
    },
  ],
  evidence: [],
  baseVersions: {
    "work-1": 3,
    "work-2": 5,
  },
  createdAt: "2026-10-03T06:00:00.000Z",
  expiresAt: "2026-10-03T07:00:00.000Z",
};

describe("proposal state machine", () => {
  it("allows approval from waiting approval", () => {
    expect(canTransitionProposal("WAITING_APPROVAL", "APPROVED")).toBe(true);
    expect(transitionProposal(proposal, "APPROVED").status).toBe("APPROVED");
  });

  it("rejects execution before approval", () => {
    expect(canTransitionProposal("WAITING_APPROVAL", "EXECUTED")).toBe(false);
    expect(() => transitionProposal(proposal, "EXECUTED")).toThrow();
  });

  it("selects only explicitly accepted changes", () => {
    const changes = selectProposalChanges(proposal, ["change-1"]);
    expect(changes).toHaveLength(1);
    expect(changes[0].id).toBe("change-1");
  });

  it("creates a stable execution key regardless of selection order", () => {
    const forward = createProposalExecutionKey(
      proposal.id,
      proposal.changes,
    );
    const reverse = createProposalExecutionKey(
      proposal.id,
      [...proposal.changes].reverse(),
    );
    expect(forward).toBe(reverse);
  });
});
