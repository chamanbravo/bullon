import type { Queue as BullQueue } from "bull";
import type { Queue as BullMQQueue } from "bullmq";
import { BullAdapter } from "./bull.adapter.ts";
import { BullMQAdapter } from "./bullmq.adapter.ts";
import type { QueueEntry } from "../context.ts";

export function createAdapter(entry: QueueEntry): BullAdapter | BullMQAdapter {
  switch (entry.type) {
    case "bull":
      return new BullAdapter(entry.queue as BullQueue, entry.displayName);
    case "bullmq":
      return new BullMQAdapter(entry.queue as BullMQQueue, entry.displayName);
    default:
      throw new Error(`Unknown queue type: ${entry.type}`);
  }
}
