export type ProductStockItem = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  inventory: Array<{
    id: string;
    warehouse: {
      id: string;
      code: string;
      name: string;
      location: string | null;
    };
    totalStock: number;
    reservedStock: number;
    availableStock: number;
  }>;
};

export type ReservationResult = {
  reservation: {
    id: string;
    productId: string;
    warehouseId: string;
    quantity: number;
    status: "pending" | "confirmed" | "released";
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
    product: {
      id: string;
      sku: string;
      name: string;
    };
    warehouse: {
      id: string;
      code: string;
      name: string;
    };
  };
  inventory: {
    id: string;
    totalStock: number;
    reservedStock: number;
    availableStock: number;
  };
};

export type ApiErrorPayload = {
  error?: {
    message?: string;
    details?: unknown;
  };
};
