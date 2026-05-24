import { Prisma, ReservationStatus } from "@prisma/client";
import { ApiError } from "@/lib/api/errors";
import { getPrismaClient } from "@/lib/prisma";
import type { CreateReservationInput } from "@/lib/validations/reservation";

type LockedInventoryRow = {
  id: string;
  totalStock: number;
  reservedStock: number;
};

type LockedReservationRow = {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: Date;
};

export async function createReservation(input: CreateReservationInput) {
  const prisma = getPrismaClient();

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

export async function confirmReservation(reservationId: string) {
  const prisma = getPrismaClient();

  const result = await prisma.$transaction(
    async (tx) => {
      const reservation = await lockReservation(tx, reservationId);

      if (!reservation) {
        throw new ApiError(404, "Reservation not found");
      }

      if (reservation.status === ReservationStatus.confirmed) {
        throw new ApiError(409, "Reservation is already confirmed");
      }

      if (reservation.status === ReservationStatus.released) {
        throw new ApiError(409, "Reservation is already released");
      }

      const inventory = await lockInventory(tx, reservation.productId, reservation.warehouseId);

      if (!inventory) {
        throw new ApiError(404, "Inventory not found for reservation");
      }

      if (reservation.expiresAt.getTime() <= Date.now()) {
        const releasedReservation = await releaseLockedReservation(tx, reservation, inventory);

        return {
          expired: true,
          result: releasedReservation,
        };
      }

      if (inventory.reservedStock < reservation.quantity) {
        throw new ApiError(409, "Reserved stock is lower than reservation quantity", {
          reservedStock: inventory.reservedStock,
          reservationQuantity: reservation.quantity,
        });
      }

      if (inventory.totalStock < reservation.quantity) {
        throw new ApiError(409, "Total stock is lower than reservation quantity", {
          totalStock: inventory.totalStock,
          reservationQuantity: reservation.quantity,
        });
      }

      const updatedInventory = await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          totalStock: {
            decrement: reservation.quantity,
          },
          reservedStock: {
            decrement: reservation.quantity,
          },
        },
      });

      const updatedReservation = await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: ReservationStatus.confirmed,
        },
        include: {
          product: true,
          warehouse: true,
        },
      });

      return {
        expired: false,
        result: formatReservationResult(updatedReservation, updatedInventory),
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  );

  if (result.expired) {
    throw new ApiError(410, "Reservation has expired and was released", result.result);
  }

  return result.result;
}

export async function releaseReservation(reservationId: string) {
  const prisma = getPrismaClient();

  return prisma.$transaction(
    async (tx) => {
      const reservation = await lockReservation(tx, reservationId);

      if (!reservation) {
        throw new ApiError(404, "Reservation not found");
      }

      if (reservation.status === ReservationStatus.confirmed) {
        throw new ApiError(409, "Confirmed reservations cannot be released");
      }

      if (reservation.status === ReservationStatus.released) {
        throw new ApiError(409, "Reservation is already released");
      }

      const inventory = await lockInventory(tx, reservation.productId, reservation.warehouseId);

      if (!inventory) {
        throw new ApiError(404, "Inventory not found for reservation");
      }

      if (inventory.reservedStock < reservation.quantity) {
        throw new ApiError(409, "Reserved stock is lower than reservation quantity", {
          reservedStock: inventory.reservedStock,
          reservationQuantity: reservation.quantity,
        });
      }

      const result = await releaseLockedReservation(tx, reservation, inventory);

      return result;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  );
}

export async function releaseExpiredReservations(limit = 100) {
  const prisma = getPrismaClient();

  return prisma.$transaction(
    async (tx) => {
      const expiredReservations = await tx.$queryRaw<LockedReservationRow[]>`
        SELECT "id", "productId", "warehouseId", "quantity", "status", "expiresAt"
        FROM "Reservation"
        WHERE "status" = ${ReservationStatus.pending}::"ReservationStatus"
          AND "expiresAt" <= NOW()
        ORDER BY "expiresAt" ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      `;

      const releasedIds: string[] = [];

      for (const reservation of expiredReservations) {
        const inventory = await lockInventory(tx, reservation.productId, reservation.warehouseId);

        if (!inventory) {
          continue;
        }

        await releaseLockedReservation(tx, reservation, inventory);
        releasedIds.push(reservation.id);
      }

      return {
        releasedCount: releasedIds.length,
        releasedIds,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  );
}

async function lockReservation(tx: Prisma.TransactionClient, reservationId: string) {
  const [reservation] = await tx.$queryRaw<LockedReservationRow[]>`
    SELECT "id", "productId", "warehouseId", "quantity", "status", "expiresAt"
    FROM "Reservation"
    WHERE "id" = ${reservationId}
    FOR UPDATE
  `;

  return reservation;
}

async function lockInventory(
  tx: Prisma.TransactionClient,
  productId: string,
  warehouseId: string,
) {
  const [inventory] = await tx.$queryRaw<LockedInventoryRow[]>`
    SELECT "id", "totalStock", "reservedStock"
    FROM "Inventory"
    WHERE "productId" = ${productId}
      AND "warehouseId" = ${warehouseId}
    FOR UPDATE
  `;

  return inventory;
}

async function releaseLockedReservation(
  tx: Prisma.TransactionClient,
  reservation: LockedReservationRow,
  inventory: LockedInventoryRow,
) {
  const releasedQuantity = Math.min(reservation.quantity, inventory.reservedStock);

  const updatedInventory = await tx.inventory.update({
    where: { id: inventory.id },
    data: {
      reservedStock: {
        decrement: releasedQuantity,
      },
    },
  });

  const updatedReservation = await tx.reservation.update({
    where: { id: reservation.id },
    data: {
      status: ReservationStatus.released,
    },
    include: {
      product: true,
      warehouse: true,
    },
  });

  return formatReservationResult(updatedReservation, updatedInventory);
}

type ReservationWithRelations = Prisma.ReservationGetPayload<{
  include: {
    product: true;
    warehouse: true;
  };
}>;

type InventorySnapshot = {
  id: string;
  totalStock: number;
  reservedStock: number;
};

function formatReservationResult(
  reservation: ReservationWithRelations,
  inventory: InventorySnapshot,
) {
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
      id: inventory.id,
      totalStock: inventory.totalStock,
      reservedStock: inventory.reservedStock,
      availableStock: inventory.totalStock - inventory.reservedStock,
    },
  };
}
