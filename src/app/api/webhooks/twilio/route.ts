import { NextResponse } from "next/server";
import twilio from "twilio";
import { handleTwilioInboundSms } from "@/lib/sms/sms-inbound-service";

export async function POST(request: Request) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    return new NextResponse("Service unavailable", { status: 503 });
  }

  const signature = request.headers.get("X-Twilio-Signature");
  if (!signature) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const formData = await request.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    params[key] = String(value);
  }

  const webhookUrl = process.env.TWILIO_WEBHOOK_URL?.trim();
  const requestUrl = webhookUrl || request.url;
  const valid = twilio.validateRequest(authToken, signature, requestUrl, params);
  if (!valid) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const from = params.From ?? "";
  const body = params.Body ?? "";
  const messageSid = params.MessageSid ?? "";

  if (!from || !messageSid) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const result = await handleTwilioInboundSms({ from, body, messageSid });

  return new NextResponse(result.twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
