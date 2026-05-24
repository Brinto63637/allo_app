export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api/errors";
import { releaseExpiredReservations } from "@/lib/services/reservation-service";

export async function POST(request: Request) {
  try {
    assertCronAuthorized(request);

    const result = await releaseExpiredReservations();

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

function assertCronAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    throw new ApiError(500, "CRON_SECRET is not configured");
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${cronSecret}`) {
    throw new ApiError(404, "Not found");
  }
}
