import { Router } from "express";
import type { Request, Response } from "express";
import type { BaseAdapter, JobStatus } from "../queue-adapter/base.adapter.ts";

const VALID_STATUSES: JobStatus[] = [
  "active",
  "waiting",
  "completed",
  "failed",
  "delayed",
  "paused",
];

function isValidStatus(s: unknown): s is JobStatus {
  return VALID_STATUSES.includes(s as JobStatus);
}

function asyncRoute(fn: (req: Request, res: Response) => Promise<void>) {
  return async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  };
}

export function createQueueRouter(adapters: BaseAdapter[]): Router {
  const router = Router();

  function find(name: string): BaseAdapter | undefined {
    return adapters.find((a) => a.getName() === name);
  }

  router.get(
    "/queues",
    asyncRoute(async (_req, res) => {
      const queues = await Promise.all(
        adapters.map(async (adapter) => ({
          name: adapter.getName(),
          displayName: adapter.getDisplayName(),
          type: adapter.getType(),
          counts: await adapter.getJobCounts(),
        })),
      );
      res.json(queues);
    }),
  );

  router.get(
    "/queues/:name",
    asyncRoute(async (req, res) => {
      const adapter = find(String(req.params.name));
      if (!adapter) {
        res.status(404).json({ error: "Queue not found" });
        return;
      }
      res.json({
        name: adapter.getName(),
        displayName: adapter.getDisplayName(),
        type: adapter.getType(),
        counts: await adapter.getJobCounts(),
      });
    }),
  );

  router.post(
    "/queues/:name/pause",
    asyncRoute(async (req, res) => {
      const adapter = find(String(req.params.name));
      if (!adapter) {
        res.status(404).json({ error: "Queue not found" });
        return;
      }
      await adapter.pauseQueue();
      res.json({ ok: true });
    }),
  );

  router.post(
    "/queues/:name/resume",
    asyncRoute(async (req, res) => {
      const adapter = find(String(req.params.name));
      if (!adapter) {
        res.status(404).json({ error: "Queue not found" });
        return;
      }
      await adapter.resumeQueue();
      res.json({ ok: true });
    }),
  );

  router.get(
    "/queues/:name/jobs",
    asyncRoute(async (req, res) => {
      const adapter = find(String(req.params.name));
      if (!adapter) {
        res.status(404).json({ error: "Queue not found" });
        return;
      }
      const status = req.query.status ?? "waiting";
      if (!isValidStatus(status)) {
        res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
        return;
      }
      const start = Math.max(0, parseInt(String(req.query.start ?? "0"), 10) || 0);
      const end = Math.max(start, parseInt(String(req.query.end ?? "20"), 10) || 20);
      res.json(await adapter.getJobs(status, start, end));
    }),
  );

  router.get(
    "/queues/:name/jobs/:id",
    asyncRoute(async (req, res) => {
      const adapter = find(String(req.params.name));
      if (!adapter) {
        res.status(404).json({ error: "Queue not found" });
        return;
      }
      const job = await adapter.getJob(String(req.params.id));
      if (!job) {
        res.status(404).json({ error: "Job not found" });
        return;
      }
      res.json(job);
    }),
  );

  router.post(
    "/queues/:name/jobs/:id/retry",
    asyncRoute(async (req, res) => {
      const adapter = find(String(req.params.name));
      if (!adapter) {
        res.status(404).json({ error: "Queue not found" });
        return;
      }
      await adapter.retryJob(String(req.params.id));
      res.json({ ok: true });
    }),
  );

  router.delete(
    "/queues/:name/jobs/:id",
    asyncRoute(async (req, res) => {
      const adapter = find(String(req.params.name));
      if (!adapter) {
        res.status(404).json({ error: "Queue not found" });
        return;
      }
      await adapter.removeJob(String(req.params.id));
      res.json({ ok: true });
    }),
  );

  return router;
}
