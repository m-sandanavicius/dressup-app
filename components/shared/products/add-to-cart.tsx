'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addItemToCart, removeItemFromCart } from '@/lib/actions/cart.actions';
import { Cart, CartItem } from '@/types';
import { ToastAction } from '@radix-ui/react-toast';
import { Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AddToCart({
  item,
  cart,
}: {
  item: CartItem;
  cart: Cart;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const handleAddToCart = async () => {
    const res = await addItemToCart(item);

    if (!res.success) {
      toast({
        variant: 'destructive',
        description: res.message,
      });
      return;
    }

    toast({
      description: `${item.name} added to cart`,
      action: (
        <ToastAction
          className="bg-primary text-white hover:bg-gray-800"
          altText="Go To Cart"
          onClick={() => router.push('/cart')}
        >
          Go To Cart
        </ToastAction>
      ),
    });
  };

  const handleRemoveFromCart = async () => {
    const res = await removeItemFromCart(item.productId);
    toast({
      variant: res.success ? 'default' : 'destructive',
      description: res.message,
    });
    return;
  };

  const existItem =
    cart && cart.items.find((i) => i.productId === item.productId);

  return existItem ? (
    <div>
      <Button type="button" variant="outline" onClick={handleRemoveFromCart}>
        <Minus className="h-4 w-4" />
      </Button>
      <span className="px-2">{existItem.quantity}</span>
      <Button type="button" variant="outline" onClick={handleAddToCart}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  ) : (
    <Button className="w-full" type="button" onClick={handleAddToCart}>
      Add To Cart
    </Button>
  );
}
