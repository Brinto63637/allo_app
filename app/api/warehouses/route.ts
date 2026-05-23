export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/errors";
import { listWarehouses } from "@/lib/services/warehouse-service";

export async function GET() {
  try {
    const warehouses = await listWarehouses();
    return NextResponse.json({ warehouses });
  } catch (error) {
    return handleApiError(error);
  }
}
