import { z } from 'zod';
import {
  cartItemSchema,
  cartSchema,
  insertProductSchema,
  shippingAddressSchema,
} from '@/lib/validators';

export type Product = z.infer<typeof insertProductSchema> & {
  id: string;
  rating: string;
  CreatedAt: Date;
};

export type Cart = z.infer<typeof cartSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
