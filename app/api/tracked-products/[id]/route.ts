import { z } from "zod";
import { supabase } from "@/lib/supabase";

const patchSchema = z.object({
  active: z.boolean(),
});

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/tracked-products/[id]">,
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tracked_products")
    .update({ active: parsed.data.active })
    .eq("id", id)
    .select("id,active")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/tracked-products/[id]">,
) {
  const { id } = await ctx.params;

  const { error } = await supabase.from("tracked_products").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
