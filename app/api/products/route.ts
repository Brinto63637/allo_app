export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/errors";
import { listProducts } from "@/lib/services/product-service";

export async function GET() {
  try {
    const products = await listProducts();
    return NextResponse.json({ products });
  } catch (error) {
    return handleApiError(error);
  }
}
