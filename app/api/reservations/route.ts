import { NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api/errors";
import { createReservation } from "@/lib/services/reservation-service";
import { createReservationSchema } from "@/lib/validations/reservation";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const input = createReservationSchema.parse(body);
    const result = await createReservation(input);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "Invalid JSON request body");
  }
}
