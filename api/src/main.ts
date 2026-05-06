import express from "express";
import Bull from "bull";
import { createBullonExpressMiddleware } from "./server-adapter/express.adapter.ts";

const app = express();

const confirmationQueue = new Bull("confirmation-queue");
const followupQueue = new Bull("followup-queue");
const notificationQueue = new Bull("no-appointment-queue");

app.use(
  "/admin",
  createBullonExpressMiddleware({
    ctx: {
      queues: [
        { queue: confirmationQueue, displayName: "Confirmation", type: "bull" as const },
        { queue: followupQueue, displayName: "Follow Up", type: "bull" as const },
        { queue: notificationQueue, displayName: "No Appointment", type: "bull" as const },
      ],
    },
  }),
);

app.listen(3000, () => {
  console.log("Bullon API running on http://localhost:3000/admin/queues");
});
