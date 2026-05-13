import { monitorSingleProduct } from "@/lib/monitoring";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/tracked-products/[id]/check">,
) {
  const { id } = await ctx.params;

  try {
    const result = await monitorSingleProduct(id);
    return Response.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error checking product";
    return Response.json({ error: message }, { status: 500 });
  }
}
