import { z } from "zod";
import { supabase } from "@/lib/supabase";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  url: z
    .string()
    .url()
    .refine((value) => {
      const host = new URL(value).hostname.replace("www.", "");
      return (
        host === "books.toscrape.com" ||
        host === "olimpica.com" ||
        host === "shein.com.co" ||
        host === "alkosto.com" ||
        host === "oportunidades.com.co"
      );
    }, "Solo se permiten URLs de books.toscrape.com, olimpica.com, shein.com.co, alkosto.com u oportunidades.com.co"),
});

export async function GET() {
  const { data, error } = await supabase
    .from("tracked_products")
    .select("id,name,url,active,created_at,users(email),price_checks(price,currency,checked_at)")
    .order("created_at", { ascending: false })
    .order("checked_at", { foreignTable: "price_checks", ascending: false })
    .limit(1, { foreignTable: "price_checks" });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, name, url } = parsed.data;

  const { data: user, error: userError } = await supabase
    .from("users")
    .upsert({ email }, { onConflict: "email" })
    .select("id,email")
    .single();

  if (userError || !user) {
    return Response.json(
      { error: userError?.message ?? "Could not create user" },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("tracked_products")
    .insert({
      user_id: user.id,
      name,
      url,
      active: true,
    })
    .select("id,name,url,active,created_at")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data }, { status: 201 });
}
