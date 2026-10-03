import { describe, expect, it } from "vitest";

import { RealtimeService } from "./realtime.service";

describe("RealtimeService", () => {
  it("publishes events to active subscribers", () => {
    const service = new RealtimeService();
    const events: string[] = [];
    const subscription = service.stream().subscribe((event) => {
      events.push(`${event.event}:${event.entityId}`);
    });

    service.publish("WORK_ITEM_CHANGED", "workitem-dashboard");
    service.publish("COMMENT_ADDED", "comment-1");
    subscription.unsubscribe();

    expect(events).toEqual([
      "WORK_ITEM_CHANGED:workitem-dashboard",
      "COMMENT_ADDED:comment-1",
    ]);
  });
});
