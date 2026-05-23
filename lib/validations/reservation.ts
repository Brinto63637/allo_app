import { z } from "zod";

export const createReservationSchema = z
  .object({
    productId: z.string().min(1),
    warehouseId: z.string().min(1),
    quantity: z.number().int().positive(),
    expiresAt: z.coerce.date(),
  })
  .refine((value) => value.expiresAt.getTime() > Date.now(), {
    message: "expiresAt must be in the future",
    path: ["expiresAt"],
  });

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
