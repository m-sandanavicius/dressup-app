'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addItemToCart, removeItemFromCart } from '@/lib/actions/cart.actions';
import { CartItem } from '@/types';
import { ToastAction } from '@radix-ui/react-toast';
import { Loader, Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function AddToCart({
  item,
  cart,
}: {
  item: CartItem;
  cart: any;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [isPending, startTransition] = useTransition();

  const handleAddToCart = async () => {
    startTransition(async () => {
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
            className="bg-primary text-white hover:bg-gray-800 w-32 p-1 rounded-md"
            altText="Go To Cart"
            onClick={() => router.push('/cart')}
          >
            Go To Cart
          </ToastAction>
        ),
      });
    });
  };

  const handleRemoveFromCart = async () => {
    startTransition(async () => {
      const res = await removeItemFromCart(item.productId);
      toast({
        variant: res.success ? 'default' : 'destructive',
        description: res.message,
      });
      return;
    });
  };

  const existItem =
    cart && cart.items.find((i: any) => i.productId === item.productId);

  return existItem ? (
    <div>
      <Button type="button" variant="outline" onClick={handleRemoveFromCart}>
        {isPending ? (
          <Loader className="w-4 h-4animate-spin" />
        ) : (
          <Minus className="h-4 w-4" />
        )}
      </Button>
      <span className="px-2">{existItem.quantity}</span>
      <Button type="button" variant="outline" onClick={handleAddToCart}>
        {isPending ? (
          <Loader className="w-4 h-4animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </Button>
    </div>
  ) : (
    <Button className="w-full" type="button" onClick={handleAddToCart}>
      {isPending ? (
        <Loader className="w-4 h-4animate-spin" />
      ) : (
        <Minus className="h-4 w-4" />
      )}{' '}
      Add To Cart
    </Button>
  );
}
