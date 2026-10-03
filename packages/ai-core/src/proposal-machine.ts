import type {
  Proposal,
  ProposalChange,
  ProposalStatus,
} from "@pms/domain";

const allowedTransitions: Record<ProposalStatus, ProposalStatus[]> = {
  DRAFT: ["WAITING_APPROVAL", "EXPIRED"],
  WAITING_APPROVAL: ["APPROVED", "REJECTED", "EXPIRED"],
  APPROVED: ["EXECUTED", "FAILED", "EXPIRED"],
  REJECTED: [],
  EXECUTED: [],
  FAILED: [],
  EXPIRED: [],
};

export function canTransitionProposal(
  currentStatus: ProposalStatus,
  nextStatus: ProposalStatus,
) {
  return allowedTransitions[currentStatus].includes(nextStatus);
}

export function transitionProposal(
  proposal: Proposal,
  nextStatus: ProposalStatus,
) {
  if (!canTransitionProposal(proposal.status, nextStatus)) {
    throw new Error(
      `Proposal cannot transition from ${proposal.status} to ${nextStatus}.`,
    );
  }

  return {
    ...proposal,
    status: nextStatus,
  };
}

export function selectProposalChanges(
  proposal: Proposal,
  acceptedChangeIds: string[],
) {
  return proposal.changes.filter((change) =>
    acceptedChangeIds.includes(change.id),
  );
}

export function hasHighRiskChange(proposal: Proposal) {
  return proposal.risk === "HIGH";
}

export function createProposalExecutionKey(
  proposalId: string,
  changes: ProposalChange[],
) {
  const changeIds = changes.map((change) => change.id).sort().join(":");
  return `${proposalId}:${changeIds}`;
}
