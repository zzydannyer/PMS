export type IntegrationProvider = "GITHUB" | "GITLAB" | "WEBHOOK";

export type IntegrationEvent = {
  id: string;
  provider: IntegrationProvider;
  eventType: string;
  externalId: string;
  payload: Record<string, string>;
  receivedAt: string;
};
