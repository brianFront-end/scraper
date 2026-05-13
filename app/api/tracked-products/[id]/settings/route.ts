import { z } from "zod";
import { supabase } from "@/lib/supabase";

const settingsSchema = z.object({
  targetPrice: z.number().positive().nullable(),
  targetDiscountPercent: z.number().min(0).max(100).nullable(),
  customMessage: z.string().max(500).nullable(),
});

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/tracked-products/[id]/settings">,
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { targetPrice, targetDiscountPercent, customMessage } = parsed.data;

  const { data, error } = await supabase
    .from("product_alert_settings")
    .upsert(
      {
        tracked_product_id: id,
        target_price: targetPrice,
        target_discount_percent: targetDiscountPercent,
        custom_message: customMessage,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tracked_product_id" },
    )
    .select("tracked_product_id,target_price,target_discount_percent,custom_message,updated_at")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data });
}
