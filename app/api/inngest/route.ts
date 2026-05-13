import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { checkProductsCron } from "@/inngest/functions/check-products";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [checkProductsCron],
});
