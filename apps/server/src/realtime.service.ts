import { Injectable } from "@nestjs/common";
import { Observable, Subject } from "rxjs";

export type PmsEvent = {
  event: "PROJECT_CHANGED" | "WORK_ITEM_CHANGED" | "COMMENT_ADDED" | "NOTIFICATION_CHANGED";
  entityId: string;
  occurredAt: string;
};

@Injectable()
export class RealtimeService {
  private readonly events = new Subject<PmsEvent>();

  stream(): Observable<PmsEvent> {
    return this.events.asObservable();
  }

  publish(event: PmsEvent["event"], entityId: string): void {
    this.events.next({
      event,
      entityId,
      occurredAt: new Date().toISOString(),
    });
  }
}
