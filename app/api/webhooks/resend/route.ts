import crypto from "crypto";
import { supabase } from "@/lib/supabase";

type ResendWebhookPayload = {
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
  };
};

function verifyResendSignature(rawBody: string, signature: string | null) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!signature) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("resend-signature");

  if (!verifyResendSignature(rawBody, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: ResendWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as ResendWebhookPayload;
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const messageId = payload.data?.email_id;
  const status = payload.type ?? "unknown";

  if (!messageId) {
    return Response.json({ error: "Missing email_id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      delivery_status: status,
      status_updated_at: payload.created_at ?? new Date().toISOString(),
      provider_payload: payload,
    })
    .eq("provider_message_id", messageId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
