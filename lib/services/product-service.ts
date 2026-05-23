import { prisma } from "@/lib/prisma";

export async function listProducts() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: {
      inventories: {
        orderBy: {
          warehouse: {
            code: "asc",
          },
        },
        include: {
          warehouse: true,
        },
      },
    },
  });

  return products.map((product) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    inventory: product.inventories.map((inventory) => ({
      id: inventory.id,
      warehouse: {
        id: inventory.warehouse.id,
        code: inventory.warehouse.code,
        name: inventory.warehouse.name,
        location: inventory.warehouse.location,
      },
      totalStock: inventory.totalStock,
      reservedStock: inventory.reservedStock,
      availableStock: inventory.totalStock - inventory.reservedStock,
    })),
  }));
}
