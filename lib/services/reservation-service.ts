import { Prisma, ReservationStatus } from "@prisma/client";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import type { CreateReservationInput } from "@/lib/validations/reservation";

type LockedInventoryRow = {
  id: string;
  totalStock: number;
  reservedStock: number;
};

export async function createReservation(input: CreateReservationInput) {
  return prisma.$transaction(
    async (tx) => {
      const [inventory] = await tx.$queryRaw<LockedInventoryRow[]>`
        SELECT "id", "totalStock", "reservedStock"
        FROM "Inventory"
        WHERE "productId" = ${input.productId}
          AND "warehouseId" = ${input.warehouseId}
        FOR UPDATE
      `;

      if (!inventory) {
        throw new ApiError(404, "Inventory not found for product and warehouse");
      }

      const availableStock = inventory.totalStock - inventory.reservedStock;

      if (availableStock < input.quantity) {
        throw new ApiError(409, "Insufficient available stock", {
          availableStock,
          requestedQuantity: input.quantity,
        });
      }

      const reservation = await tx.reservation.create({
        data: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          quantity: input.quantity,
          status: ReservationStatus.pending,
          expiresAt: input.expiresAt,
        },
        include: {
          product: true,
          warehouse: true,
        },
      });

      const updatedInventory = await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          reservedStock: {
            increment: input.quantity,
          },
        },
      });

      return {
        reservation: {
          id: reservation.id,
          productId: reservation.productId,
          warehouseId: reservation.warehouseId,
          quantity: reservation.quantity,
          status: reservation.status,
          expiresAt: reservation.expiresAt,
          createdAt: reservation.createdAt,
          updatedAt: reservation.updatedAt,
          product: {
            id: reservation.product.id,
            sku: reservation.product.sku,
            name: reservation.product.name,
          },
          warehouse: {
            id: reservation.warehouse.id,
            code: reservation.warehouse.code,
            name: reservation.warehouse.name,
          },
        },
        inventory: {
          id: updatedInventory.id,
          totalStock: updatedInventory.totalStock,
          reservedStock: updatedInventory.reservedStock,
          availableStock: updatedInventory.totalStock - updatedInventory.reservedStock,
        },
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  );
}
