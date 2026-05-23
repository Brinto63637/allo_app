import { prisma } from "@/lib/prisma";

export async function listWarehouses() {
  const warehouses = await prisma.warehouse.findMany({
    orderBy: { code: "asc" },
    include: {
      inventories: {
        orderBy: {
          product: {
            sku: "asc",
          },
        },
        include: {
          product: true,
        },
      },
    },
  });

  return warehouses.map((warehouse) => ({
    id: warehouse.id,
    code: warehouse.code,
    name: warehouse.name,
    location: warehouse.location,
    createdAt: warehouse.createdAt,
    updatedAt: warehouse.updatedAt,
    inventory: warehouse.inventories.map((inventory) => ({
      id: inventory.id,
      product: {
        id: inventory.product.id,
        sku: inventory.product.sku,
        name: inventory.product.name,
        description: inventory.product.description,
      },
      totalStock: inventory.totalStock,
      reservedStock: inventory.reservedStock,
      availableStock: inventory.totalStock - inventory.reservedStock,
    })),
  }));
}
