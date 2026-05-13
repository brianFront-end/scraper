import { cron } from "inngest";
import { inngest } from "@/inngest/client";
import { monitorActiveProducts } from "@/lib/monitoring";

export const checkProductsCron = inngest.createFunction(
  {
    id: "check-products-cron",
    triggers: [cron("0 */4 * * *")],
  },
  async () => monitorActiveProducts(),
);
