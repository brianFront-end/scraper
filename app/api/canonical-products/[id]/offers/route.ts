import { z } from "zod";
import { supabase } from "@/lib/supabase";

const schema = z.object({
  trackedProductId: z.string().uuid(),
  store: z.string().min(2),
  url: z.string().url(),
  externalSku: z.string().optional(),
});

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/canonical-products/[id]/offers">,
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { trackedProductId, store, url, externalSku } = parsed.data;

  const { data, error } = await supabase
    .from("product_offers")
    .insert({
      canonical_product_id: id,
      tracked_product_id: trackedProductId,
      store,
      url,
      external_sku: externalSku ?? null,
    })
    .select("id,canonical_product_id,tracked_product_id,store,url")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data }, { status: 201 });
}
