import type { Router } from "express";
import type { BullonContext } from "../context.ts";
import { createAdapter } from "../queue-adapter/adapter.factory.ts";
import { createQueueRouter } from "../router/queue.router.ts";

export function createBullonExpressMiddleware(options: {
  ctx: BullonContext;
}): Router {
  const adapters = options.ctx.queues.map(createAdapter);
  return createQueueRouter(adapters);
}
