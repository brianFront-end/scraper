import { Resend } from "resend";
import { scrapeBookPrice } from "@/lib/scrape";
import { supabase } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);
const ALERT_COOLDOWN_HOURS = 6;

type ProductRow = {
  id: string;
  name: string;
  url: string;
  users: { email: string } | null;
};

type AlertSettings = {
  target_price: number | null;
  target_discount_percent: number | null;
  custom_message: string | null;
};

export async function monitorSingleProduct(productId: string) {
  const { data, error } = await supabase
    .from("tracked_products")
    .select("id,name,url,active,users(email)")
    .eq("id", productId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Product not found");
  }

  if (!data.active) {
    return { checked: false, reason: "inactive" };
  }

  const product = data as unknown as ProductRow & { active: boolean };
  const { data: previousCheck } = await supabase
    .from("price_checks")
    .select("price,currency,checked_at")
    .eq("tracked_product_id", product.id)
    .order("checked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: settingsRow } = await supabase
    .from("product_alert_settings")
    .select("target_price,target_discount_percent,custom_message")
    .eq("tracked_product_id", product.id)
    .maybeSingle();

  const settings = (settingsRow ?? {
    target_price: null,
    target_discount_percent: null,
    custom_message: null,
  }) as AlertSettings;

  const result = await scrapeBookPrice(product.url);

  const { data: lastNotification } = await supabase
    .from("notifications")
    .select("sent_at")
    .eq("tracked_product_id", product.id)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("price_checks").insert({
    tracked_product_id: product.id,
    price: result.price,
    currency: result.currency,
  });

  const userEmail = product.users?.email;
  const discountPercent =
    previousCheck && previousCheck.price > 0
      ? ((previousCheck.price - result.price) / previousCheck.price) * 100
      : null;

  const hasConfiguredRule =
    settings.target_price !== null || settings.target_discount_percent !== null;

  const targetPriceMet =
    settings.target_price !== null && result.price <= settings.target_price;
  const targetDiscountMet =
    settings.target_discount_percent !== null &&
    discountPercent !== null &&
    discountPercent >= settings.target_discount_percent;

  const shouldSendEmail = hasConfiguredRule ? targetPriceMet || targetDiscountMet : true;
  const cooldownUntil = lastNotification?.sent_at
    ? new Date(new Date(lastNotification.sent_at).getTime() + ALERT_COOLDOWN_HOURS * 60 * 60 * 1000)
    : null;
  const cooldownPassed = !cooldownUntil || new Date() >= cooldownUntil;

  if (userEmail && shouldSendEmail && cooldownPassed) {
    const ruleSummary = hasConfiguredRule
      ? `<p><strong>Regla activada:</strong> ${targetPriceMet ? "precio objetivo" : "descuento objetivo"}</p>`
      : "<p><strong>Regla activada:</strong> monitoreo cada 30 minutos</p>";
    const customMessage = settings.custom_message
      ? `<p><strong>Mensaje personalizado:</strong> ${settings.custom_message}</p>`
      : "";

    const sendResult = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: userEmail,
      subject: `Precio consultado: ${result.title}`,
      html: `
        <h2>Consulta de producto</h2>
        <p><strong>Producto:</strong> ${result.title}</p>
        <p><strong>Precio actual:</strong> ${result.currency} ${result.price}</p>
        ${
          discountPercent !== null
            ? `<p><strong>Variación vs último check:</strong> ${discountPercent.toFixed(2)}%</p>`
            : ""
        }
        ${ruleSummary}
        ${customMessage}
        <p><strong>URL:</strong> <a href="${product.url}">${product.url}</a></p>
      `,
    });

    await supabase.from("notifications").insert({
      tracked_product_id: product.id,
      email: userEmail,
      provider_message_id: sendResult.data?.id ?? null,
      delivery_status: "sent",
      status_updated_at: new Date().toISOString(),
      payload: {
        title: result.title,
        price: result.price,
        currency: result.currency,
        discountPercent,
        targetPrice: settings.target_price,
        targetDiscountPercent: settings.target_discount_percent,
        customMessage: settings.custom_message,
      },
      provider_payload: sendResult,
    });
  }

  return {
    checked: true,
    emailed: Boolean(userEmail && shouldSendEmail && cooldownPassed),
    ruleApplied: hasConfiguredRule,
    cooldownHours: ALERT_COOLDOWN_HOURS,
  };
}

export async function monitorActiveProducts() {
  const { data, error } = await supabase
    .from("tracked_products")
    .select("id,name,url,users(email)")
    .eq("active", true);

  if (error) throw error;

  const products = (data ?? []) as unknown as ProductRow[];
  if (!products.length) return { checked: 0 };

  let checked = 0;
  for (const product of products) {
    try {
      await monitorSingleProduct(product.id);
      checked += 1;
    } catch (err) {
      console.error(`Failed to check product ${product.id}`, err);
    }
  }

  return { checked };
}
