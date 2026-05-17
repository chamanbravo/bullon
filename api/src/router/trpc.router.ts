import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import type { BaseAdapter } from "../queue-adapter/base.adapter.ts";

export type BullonTRPCContext = { adapters: BaseAdapter[] };

const t = initTRPC.context<BullonTRPCContext>().create();

const router = t.router;
const procedure = t.procedure;

const jobStatusSchema = z.enum([
  "active",
  "waiting",
  "completed",
  "failed",
  "delayed",
  "paused",
]);

function findAdapter(adapters: BaseAdapter[], name: string): BaseAdapter {
  const adapter = adapters.find((a) => a.getName() === name);
  if (!adapter) throw new TRPCError({ code: "NOT_FOUND", message: "Queue not found" });
  return adapter;
}

export const appRouter = router({
  queues: router({
    list: procedure.query(({ ctx }) =>
      Promise.all(
        ctx.adapters.map(async (adapter) => ({
          name: adapter.getName(),
          displayName: adapter.getDisplayName(),
          type: adapter.getType(),
          counts: await adapter.getJobCounts(),
        })),
      ),
    ),

    get: procedure
      .input(z.object({ name: z.string() }))
      .query(async ({ ctx, input }) => {
        const adapter = findAdapter(ctx.adapters, input.name);
        return {
          name: adapter.getName(),
          displayName: adapter.getDisplayName(),
          type: adapter.getType(),
          counts: await adapter.getJobCounts(),
        };
      }),

    pause: procedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await findAdapter(ctx.adapters, input.name).pauseQueue();
        return { ok: true };
      }),

    resume: procedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await findAdapter(ctx.adapters, input.name).resumeQueue();
        return { ok: true };
      }),

    jobs: router({
      list: procedure
        .input(
          z.object({
            name: z.string(),
            status: jobStatusSchema.default("waiting"),
            start: z.number().min(0).default(0),
            end: z.number().min(0).default(20),
          }),
        )
        .query(({ ctx, input }) =>
          findAdapter(ctx.adapters, input.name).getJobs(
            input.status,
            input.start,
            input.end,
          ),
        ),

      get: procedure
        .input(z.object({ name: z.string(), id: z.string() }))
        .query(async ({ ctx, input }) => {
          const job = await findAdapter(ctx.adapters, input.name).getJob(input.id);
          if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
          return job;
        }),

      retry: procedure
        .input(z.object({ name: z.string(), id: z.string() }))
        .mutation(async ({ ctx, input }) => {
          await findAdapter(ctx.adapters, input.name).retryJob(input.id);
          return { ok: true };
        }),

      remove: procedure
        .input(z.object({ name: z.string(), id: z.string() }))
        .mutation(async ({ ctx, input }) => {
          await findAdapter(ctx.adapters, input.name).removeJob(input.id);
          return { ok: true };
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
