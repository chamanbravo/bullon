import type { Queue as BullQueue } from "bull";
import type { Queue as BullMQQueue } from "bullmq";

export type QueueEntry = {
  queue: BullQueue | BullMQQueue;
  displayName: string;
  type: "bull" | "bullmq";
};

export type BullonContext = {
  queues: QueueEntry[];
};
