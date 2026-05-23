import { ReservationCheckout } from "@/components/reservation-checkout";
import { listProducts } from "@/lib/services/product-service";
import type { ProductStockItem } from "@/lib/types/reservation-ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await listProducts();
  const productItems: ProductStockItem[] = products.map((product) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    inventory: product.inventory.map((inventory) => ({
      id: inventory.id,
      warehouse: inventory.warehouse,
      totalStock: inventory.totalStock,
      reservedStock: inventory.reservedStock,
      availableStock: inventory.availableStock,
    })),
  }));

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8">
      <header className="mb-8 flex flex-col gap-3 border-b border-slate-200 pb-6">
        <p className="text-sm font-medium uppercase text-slate-500">
          Inventory Reservation System
        </p>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">Product Listing</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Review warehouse availability, reserve one unit, and complete or cancel the checkout
              hold.
            </p>
          </div>
          <p className="text-sm text-slate-500">{productItems.length} products</p>
        </div>
      </header>

      <ReservationCheckout products={productItems} />
    </main>
  );
}
