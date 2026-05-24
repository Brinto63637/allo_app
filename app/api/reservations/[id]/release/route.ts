export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/errors";
import { releaseReservation } from "@/lib/services/reservation-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const result = await releaseReservation(id);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
