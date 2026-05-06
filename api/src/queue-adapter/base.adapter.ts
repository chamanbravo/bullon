export type JobCounts = Partial<Record<string, number>>;

export type JobStatus =
  | "active"
  | "waiting"
  | "completed"
  | "failed"
  | "delayed"
  | "paused";

export type Job = {
  id: string;
  name: string;
  data: unknown;
  opts: unknown;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  stacktrace?: string[];
  returnValue?: unknown;
  attemptsMade: number;
};

export abstract class BaseAdapter {
  private readonly _name: string;
  private readonly _displayName: string;
  protected jobNameFn?: (data: Record<string, unknown>) => string;

  constructor(
    name: string,
    displayName?: string,
    jobNameFn?: (data: Record<string, unknown>) => string,
  ) {
    this._name = name;
    this._displayName = displayName ?? name;
    this.jobNameFn = jobNameFn;
  }

  abstract getType(): "bull" | "bullmq";
  abstract getJobCounts(): Promise<JobCounts>;
  abstract getJobs(status: JobStatus, start?: number, end?: number): Promise<Job[]>;
  abstract getJob(id: string): Promise<Job | null>;
  abstract retryJob(id: string): Promise<void>;
  abstract removeJob(id: string): Promise<void>;
  abstract pauseQueue(): Promise<void>;
  abstract resumeQueue(): Promise<void>;

  getName(): string {
    return this._name;
  }

  getDisplayName(): string {
    return this._displayName;
  }
}
