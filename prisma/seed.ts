import { PrismaClient, ReservationStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: "SKU-TSHIRT-BLK-M" },
      update: {},
      create: {
        sku: "SKU-TSHIRT-BLK-M",
        name: "Black T-Shirt - Medium",
        description: "Cotton crew neck t-shirt",
      },
    }),
    prisma.product.upsert({
      where: { sku: "SKU-HOODIE-GRY-L" },
      update: {},
      create: {
        sku: "SKU-HOODIE-GRY-L",
        name: "Gray Hoodie - Large",
        description: "Fleece pullover hoodie",
      },
    }),
    prisma.product.upsert({
      where: { sku: "SKU-MUG-WHT-12" },
      update: {},
      create: {
        sku: "SKU-MUG-WHT-12",
        name: "White Mug - 12 oz",
        description: "Ceramic coffee mug",
      },
    }),
  ]);

  const warehouses = await Promise.all([
    prisma.warehouse.upsert({
      where: { code: "NYC-01" },
      update: {},
      create: {
        code: "NYC-01",
        name: "New York Fulfillment Center",
        location: "New York, NY",
      },
    }),
    prisma.warehouse.upsert({
      where: { code: "DAL-01" },
      update: {},
      create: {
        code: "DAL-01",
        name: "Dallas Distribution Hub",
        location: "Dallas, TX",
      },
    }),
  ]);

  await Promise.all([
    prisma.inventory.upsert({
      where: {
        productId_warehouseId: {
          productId: products[0].id,
          warehouseId: warehouses[0].id,
        },
      },
      update: { totalStock: 120, reservedStock: 8 },
      create: {
        productId: products[0].id,
        warehouseId: warehouses[0].id,
        totalStock: 120,
        reservedStock: 8,
      },
    }),
    prisma.inventory.upsert({
      where: {
        productId_warehouseId: {
          productId: products[1].id,
          warehouseId: warehouses[0].id,
        },
      },
      update: { totalStock: 65, reservedStock: 5 },
      create: {
        productId: products[1].id,
        warehouseId: warehouses[0].id,
        totalStock: 65,
        reservedStock: 5,
      },
    }),
    prisma.inventory.upsert({
      where: {
        productId_warehouseId: {
          productId: products[2].id,
          warehouseId: warehouses[1].id,
        },
      },
      update: { totalStock: 240, reservedStock: 12 },
      create: {
        productId: products[2].id,
        warehouseId: warehouses[1].id,
        totalStock: 240,
        reservedStock: 12,
      },
    }),
  ]);

  await prisma.reservation.deleteMany({});

  await prisma.reservation.createMany({
    data: [
      {
        productId: products[0].id,
        warehouseId: warehouses[0].id,
        quantity: 3,
        status: ReservationStatus.pending,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
      {
        productId: products[1].id,
        warehouseId: warehouses[0].id,
        quantity: 5,
        status: ReservationStatus.confirmed,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        productId: products[2].id,
        warehouseId: warehouses[1].id,
        quantity: 4,
        status: ReservationStatus.released,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000),
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
