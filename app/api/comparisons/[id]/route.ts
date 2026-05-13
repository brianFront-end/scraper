import { supabase } from "@/lib/supabase";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/comparisons/[id]">,
) {
  const { id } = await ctx.params;

  const { error } = await supabase.from("comparison_groups").delete().eq("id", id);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
