import { Resend } from "resend";
import { childLogger } from "@/lib/logging/logger";

const log = childLogger({});

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
};

export async function sendTransactionalEmail(input: SendEmailInput): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL ?? "ANCHOR Care <notifications@anchrcare.com>";

  if (!apiKey) {
    log.info(
      { to: input.to, subject: input.subject },
      "transactional email (dev log — set RESEND_API_KEY to send)",
    );
    return { id: "dev-noop" };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  if (error) {
    log.error({ error, to: input.to }, "resend send failed");
    throw new Error(error.message);
  }

  return { id: data?.id ?? "unknown" };
}
