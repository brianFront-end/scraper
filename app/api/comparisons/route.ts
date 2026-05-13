import { z } from "zod";
import { supabase } from "@/lib/supabase";

const schema = z.object({
  name: z.string().min(2),
  productIds: z.array(z.string().uuid()).min(2),
});

export async function GET() {
  const { data: groups, error: groupsError } = await supabase
    .from("comparison_groups")
    .select("id,name,created_at")
    .order("created_at", { ascending: false });

  if (groupsError) {
    return Response.json({ error: groupsError.message }, { status: 500 });
  }

  const groupIds = (groups ?? []).map((g) => g.id);
  const { data: items } = groupIds.length
    ? await supabase
        .from("comparison_group_items")
        .select("comparison_group_id,tracked_product_id,tracked_products(id,name,url,active,price_checks(price,currency,checked_at))")
        .in("comparison_group_id", groupIds)
    : { data: [] as unknown[] };

  const mapped = (groups ?? []).map((group) => {
    const groupItems = ((items ?? []) as Array<Record<string, unknown>>).filter(
      (item) => item.comparison_group_id === group.id,
    );

    const products = groupItems.map((item) => {
      const product = item.tracked_products as {
        id: string;
        name: string;
        url: string;
        active: boolean;
        price_checks?: Array<{ price: number; currency: string; checked_at: string }>;
      };
      const latest = product.price_checks?.[0];
      return {
        id: product.id,
        name: product.name,
        url: product.url,
        active: product.active,
        latestPrice: latest?.price ?? null,
        currency: latest?.currency ?? null,
        checkedAt: latest?.checked_at ?? null,
      };
    });

    return {
      ...group,
      products,
    };
  });

  return Response.json({ data: mapped });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, productIds } = parsed.data;

  const { data: group, error: groupError } = await supabase
    .from("comparison_groups")
    .insert({ name })
    .select("id,name,created_at")
    .single();

  if (groupError || !group) {
    return Response.json({ error: groupError?.message ?? "Error creating group" }, { status: 500 });
  }

  const rows = productIds.map((productId) => ({
    comparison_group_id: group.id,
    tracked_product_id: productId,
  }));

  const { error: itemsError } = await supabase.from("comparison_group_items").insert(rows);
  if (itemsError) {
    return Response.json({ error: itemsError.message }, { status: 500 });
  }

  return Response.json({ data: group }, { status: 201 });
}
