import type { RealtimeEvent } from "./contracts.js";

export function subscribeRealtime(
  baseUrl: string,
  onEvent: (event: RealtimeEvent) => void,
): () => void {
  const source = new EventSource(`${baseUrl}/api/events`);
  source.onmessage = (message) => {
    onEvent(JSON.parse(message.data) as RealtimeEvent);
  };
  return () => source.close();
}
