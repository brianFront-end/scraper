import { z } from "zod";
import { supabase } from "@/lib/supabase";

const schema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  canonicalName: z.string().min(2),
});

export async function GET() {
  const { data, error } = await supabase
    .from("canonical_products")
    .select("id,brand,model,canonical_name,created_at")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { brand, model, canonicalName } = parsed.data;
  const { data, error } = await supabase
    .from("canonical_products")
    .insert({ brand, model, canonical_name: canonicalName })
    .select("id,brand,model,canonical_name")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data }, { status: 201 });
}
