import { createExpressMiddleware } from "@trpc/server/adapters/express";
import type { RequestHandler } from "express";
import type { BullonContext } from "../context.ts";
import { createBullonTRPCRouter } from "./trpc.adapter.ts";

export function createBullonExpressMiddleware(options: {
  ctx: BullonContext;
}): RequestHandler {
  return createExpressMiddleware(createBullonTRPCRouter(options));
}
