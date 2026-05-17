import type { BullonContext } from "../context.ts";
import { createAdapter } from "../queue-adapter/adapter.factory.ts";
import { appRouter, type BullonTRPCContext } from "../router/trpc.router.ts";

export type { AppRouter } from "../router/trpc.router.ts";

/**
 * Returns the tRPC router and a context factory for use with any framework adapter.
 *
 * Express:    createExpressMiddleware({ ...createBullonTRPCRouter(opts) })
 * Next.js:    fetchRequestHandler({ ...createBullonTRPCRouter(opts), req, endpoint })
 * Fastify:    fastifyTRPCPlugin with { ...createBullonTRPCRouter(opts) }
 * Standalone: createHTTPServer({ ...createBullonTRPCRouter(opts) })
 */
export function createBullonTRPCRouter(options: { ctx: BullonContext }) {
  const adapters = options.ctx.queues.map(createAdapter);
  return {
    router: appRouter,
    createContext: (): BullonTRPCContext => ({ adapters }),
  };
}
