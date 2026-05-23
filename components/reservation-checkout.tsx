"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { StatusMessage } from "@/components/status-message";
import { useCountdown } from "@/hooks/use-countdown";
import type {
  ApiErrorPayload,
  ProductStockItem,
  ReservationResult,
} from "@/lib/types/reservation-ui";

type ReservationCheckoutProps = {
  products: ProductStockItem[];
};

type CheckoutError = {
  status?: number;
  message: string;
};

export function ReservationCheckout({ products }: ReservationCheckoutProps) {
  const router = useRouter();
  const [reservation, setReservation] = useState<ReservationResult | null>(null);
  const [pendingKey, setPendingKey] = useState<string>();
  const [action, setAction] = useState<"confirm" | "release" | null>(null);
  const [error, setError] = useState<CheckoutError | null>(null);
  const [notice, setNotice] = useState<string>();
  const countdown = useCountdown(reservation?.reservation.expiresAt);

  const selectedStock = useMemo(() => {
    if (!reservation) {
      return null;
    }

    return products
      .find((product) => product.id === reservation.reservation.productId)
      ?.inventory.find(
        (inventory) => inventory.warehouse.id === reservation.reservation.warehouseId,
      );
  }, [products, reservation]);

  async function reserve(productId: string, warehouseId: string) {
    setError(null);
    setNotice(undefined);
    setPendingKey(`${productId}:${warehouseId}`);

    try {
      const result = await postJson<ReservationResult>("/api/reservations", {
        productId,
        warehouseId,
        quantity: 1,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

      setReservation(result);
      setNotice("Reservation held for 10 minutes.");
      router.refresh();
    } catch (requestError) {
      setError(normalizeError(requestError));
    } finally {
      setPendingKey(undefined);
    }
  }

  async function confirm() {
    if (!reservation) {
      return;
    }

    setAction("confirm");
    setError(null);
    setNotice(undefined);

    try {
      const result = await postJson<ReservationResult>(
        `/api/reservations/${reservation.reservation.id}/confirm`,
      );

      setReservation(result);
      setNotice("Purchase confirmed. Stock has been deducted.");
      router.refresh();
    } catch (requestError) {
      const normalized = normalizeError(requestError);
      setError(normalized);

      if (normalized.status === 410) {
        setReservation(null);
        router.refresh();
      }
    } finally {
      setAction(null);
    }
  }

  async function release() {
    if (!reservation) {
      return;
    }

    setAction("release");
    setError(null);
    setNotice(undefined);

    try {
      const result = await postJson<ReservationResult>(
        `/api/reservations/${reservation.reservation.id}/release`,
      );

      setReservation(result);
      setNotice("Reservation cancelled. Stock is available again.");
      router.refresh();
    } catch (requestError) {
      setError(normalizeError(requestError));
    } finally {
      setAction(null);
    }
  }

  const activeReservation =
    reservation?.reservation.status === "pending" && !countdown.isExpired ? reservation : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4">
        {products.length === 0 ? (
          <StatusMessage tone="info">No products are available yet.</StatusMessage>
        ) : null}

        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            selectedProductId={activeReservation?.reservation.productId}
            selectedWarehouseId={activeReservation?.reservation.warehouseId}
            pendingKey={pendingKey}
            onReserve={reserve}
          />
        ))}
      </section>

      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
        <div className="border-b border-slate-200 pb-4">
          <p className="text-sm font-medium uppercase text-slate-500">Checkout</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Reservation details</h2>
        </div>

        <div className="mt-5 space-y-4">
          {error ? <StatusMessage tone="error">{error.message}</StatusMessage> : null}
          {notice ? <StatusMessage tone="success">{notice}</StatusMessage> : null}

          {!reservation ? (
            <p className="text-sm text-slate-600">
              Choose a warehouse row and reserve one unit to start checkout.
            </p>
          ) : null}

          {reservation ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Product</p>
                <p className="font-medium text-slate-950">{reservation.reservation.product.name}</p>
                <p className="text-sm text-slate-500">{reservation.reservation.product.sku}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Warehouse</p>
                <p className="font-medium text-slate-950">
                  {reservation.reservation.warehouse.name}
                </p>
                <p className="text-sm text-slate-500">{reservation.reservation.warehouse.code}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs uppercase text-slate-500">Quantity</p>
                  <p className="text-lg font-semibold text-slate-950">
                    {reservation.reservation.quantity}
                  </p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs uppercase text-slate-500">Status</p>
                  <p className="text-lg font-semibold capitalize text-slate-950">
                    {reservation.reservation.status}
                  </p>
                </div>
              </div>

              {reservation.reservation.status === "pending" ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-900">Hold expires in</p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums text-amber-950">
                    {countdown.label}
                  </p>
                  {countdown.isExpired ? (
                    <p className="mt-2 text-sm text-amber-800">
                      This hold has expired. Confirming will return `410 Gone`.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs uppercase text-slate-500">Current stock snapshot</p>
                <p className="mt-1 text-sm text-slate-700">
                  {reservation.inventory.availableStock} available,{" "}
                  {reservation.inventory.reservedStock} reserved,{" "}
                  {reservation.inventory.totalStock} total
                </p>
                {selectedStock ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Listing may update automatically after each action.
                  </p>
                ) : null}
              </div>

              {reservation.reservation.status === "pending" ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <button
                    type="button"
                    onClick={confirm}
                    disabled={action !== null}
                    className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {action === "confirm" ? "Confirming" : "Confirm purchase"}
                  </button>
                  <button
                    type="button"
                    onClick={release}
                    disabled={action !== null}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    {action === "release" ? "Cancelling" : "Cancel reservation"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json().catch(() => ({}))) as T & ApiErrorPayload;

  if (!response.ok) {
    throw {
      status: response.status,
      message: payload.error?.message ?? "Request failed",
    };
  }

  return payload;
}

function normalizeError(error: unknown): CheckoutError {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "message" in error
  ) {
    const status = Number((error as CheckoutError).status);
    const message = String((error as CheckoutError).message);

    if (status === 409) {
      return {
        status,
        message: `409 Conflict: ${message}`,
      };
    }

    if (status === 410) {
      return {
        status,
        message: `410 Gone: ${message}`,
      };
    }

    return {
      status,
      message,
    };
  }

  return {
    message: "Something went wrong. Please try again.",
  };
}
