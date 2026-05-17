import type { Queue as BullMQQueue } from "bullmq";
import { BaseAdapter, type Job, type JobCounts, type JobStatus } from "./base.adapter.ts";

// BullMQ uses "wait" where our normalized type uses "waiting"
type BullMQStatus = "active" | "wait" | "completed" | "failed" | "delayed" | "paused";

function toBullMQStatus(status: JobStatus): BullMQStatus {
  return status === "waiting" ? "wait" : status;
}

export class BullMQAdapter extends BaseAdapter {
  private readonly queue: BullMQQueue;

  constructor(queue: BullMQQueue, displayName?: string) {
    super(queue.name, displayName);
    this.queue = queue;
  }

  getType(): "bullmq" {
    return "bullmq";
  }

  async getJobCounts(): Promise<JobCounts> {
    const counts = await this.queue.getJobCounts(
      "active",
      "wait",
      "completed",
      "failed",
      "delayed",
      "paused",
    );
    return {
      active: counts.active ?? 0,
      waiting: counts.wait ?? 0,
      completed: counts.completed ?? 0,
      failed: counts.failed ?? 0,
      delayed: counts.delayed ?? 0,
      paused: counts.paused ?? 0,
    };
  }

  async getJobs(status: JobStatus, start = 0, end = 20): Promise<Job[]> {
    const jobs = await this.queue.getJobs([toBullMQStatus(status)], start, end);
    return jobs.map((job) => ({
      id: String(job.id),
      name: job.name,
      data: job.data,
      opts: job.opts,
      timestamp: job.timestamp,
      processedOn: job.processedOn ?? undefined,
      finishedOn: job.finishedOn ?? undefined,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace ?? undefined,
      returnValue: job.returnvalue,
      attemptsMade: job.attemptsMade,
    }));
  }

  async getJob(id: string): Promise<Job | null> {
    const job = await this.queue.getJob(id);
    if (!job) return null;
    return {
      id: String(job.id),
      name: job.name,
      data: job.data,
      opts: job.opts,
      timestamp: job.timestamp,
      processedOn: job.processedOn ?? undefined,
      finishedOn: job.finishedOn ?? undefined,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace ?? undefined,
      returnValue: job.returnvalue,
      attemptsMade: job.attemptsMade,
    };
  }

  async retryJob(id: string): Promise<void> {
    const job = await this.queue.getJob(id);
    if (!job) throw new Error(`Job ${id} not found`);
    await job.retry("failed");
  }

  async removeJob(id: string): Promise<void> {
    const job = await this.queue.getJob(id);
    if (!job) throw new Error(`Job ${id} not found`);
    await job.remove();
  }

  async pauseQueue(): Promise<void> {
    await this.queue.pause();
  }

  async resumeQueue(): Promise<void> {
    await this.queue.resume();
  }
}
