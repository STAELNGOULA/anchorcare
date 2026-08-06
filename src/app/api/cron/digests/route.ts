import { NextResponse } from "next/server";
import "@/lib/jobs/handlers";
import { enqueueJob, processBackgroundJobs } from "@/lib/jobs/queue";
import {
  getIsoWeekPeriodKey,
  listDigestEligibleCoaches,
  listDigestEligibleOrgs,
  listDigestEligibleParents,
  localDayInTimezone,
  wasDigestSent,
} from "@/lib/digest/digest-service";
import { childLogger } from "@/lib/logging/logger";
import { generateRequestId, REQUEST_ID_HEADER } from "@/lib/logging/request-id";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

const PARENT_DIGEST_DAY = 0; // Sunday
const BUSINESS_DIGEST_DAY = 1; // Monday
const COACH_DIGEST_DAY = 1;

export async function GET(request: Request) {
  const requestId = request.headers.get(REQUEST_ID_HEADER) ?? generateRequestId();
  const log = childLogger({ requestId, path: "/api/cron/digests" });

  if (!authorizeCron(request)) {
    log.warn("cron digests unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const periodKey = getIsoWeekPeriodKey();
  let enqueued = 0;

  try {
    const parents = await listDigestEligibleParents();
    for (const parent of parents) {
      if (localDayInTimezone(parent.timezone) !== PARENT_DIGEST_DAY) continue;
      if (await wasDigestSent("parent", parent.parentId, periodKey)) continue;

      await enqueueJob({
        type: "weekly_parent_digest",
        payload: { parentId: parent.parentId, email: parent.email, periodKey },
        idempotencyKey: `weekly-parent-digest-${parent.parentId}-${periodKey}`,
      });
      enqueued += 1;
    }

    const orgs = await listDigestEligibleOrgs();
    for (const org of orgs) {
      if (localDayInTimezone(org.timezone) !== BUSINESS_DIGEST_DAY) continue;
      if (await wasDigestSent("business", org.orgId, periodKey)) continue;

      await enqueueJob({
        type: "weekly_business_digest",
        payload: {
          orgId: org.orgId,
          recipientEmails: org.recipientEmails,
          periodKey,
        },
        idempotencyKey: `weekly-business-digest-${org.orgId}-${periodKey}`,
      });
      enqueued += 1;
    }

    const coaches = await listDigestEligibleCoaches();
    for (const coach of coaches) {
      if (localDayInTimezone("America/Toronto") !== COACH_DIGEST_DAY) continue;
      if (await wasDigestSent("coach", coach.coachId, periodKey)) continue;

      await enqueueJob({
        type: "weekly_coach_digest",
        payload: {
          coachId: coach.coachId,
          email: coach.email,
          orgId: coach.orgId,
          periodKey,
        },
        idempotencyKey: `weekly-coach-digest-${coach.coachId}-${periodKey}`,
      });
      enqueued += 1;
    }

    const result = await processBackgroundJobs(25);
    log.info({ enqueued, ...result }, "weekly digests processed");

    return NextResponse.json({ ok: true, requestId, enqueued, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Digest cron failed";
    log.error({ message }, "cron digests error");
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}
