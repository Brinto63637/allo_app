import type { ProductStockItem } from "@/lib/types/reservation-ui";

type ProductCardProps = {
  product: ProductStockItem;
  selectedProductId?: string;
  selectedWarehouseId?: string;
  pendingKey?: string;
  onReserve: (productId: string, warehouseId: string) => void;
};

export function ProductCard({
  product,
  selectedProductId,
  selectedWarehouseId,
  pendingKey,
  onReserve,
}: ProductCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase text-slate-500">{product.sku}</p>
        <h2 className="text-lg font-semibold text-slate-950">{product.name}</h2>
        {product.description ? (
          <p className="text-sm text-slate-600">{product.description}</p>
        ) : null}
      </div>

      <div className="mt-5 space-y-3">
        {product.inventory.map((inventory) => {
          const key = `${product.id}:${inventory.warehouse.id}`;
          const isPending = pendingKey === key;
          const isSelected =
            selectedProductId === product.id && selectedWarehouseId === inventory.warehouse.id;
          const disabled = inventory.availableStock <= 0 || isPending;

          return (
            <div
              key={inventory.id}
              className={`rounded-md border p-4 ${
                isSelected ? "border-slate-900 bg-slate-50" : "border-slate-200"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{inventory.warehouse.name}</p>
                  <p className="text-sm text-slate-500">
                    {inventory.warehouse.code}
                    {inventory.warehouse.location ? ` - ${inventory.warehouse.location}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-950">
                      {inventory.availableStock} available
                    </p>
                    <p className="text-xs text-slate-500">
                      {inventory.totalStock} total - {inventory.reservedStock} reserved
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onReserve(product.id, inventory.warehouse.id)}
                    disabled={disabled}
                    className="min-w-24 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isPending ? "Reserving" : "Reserve"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
