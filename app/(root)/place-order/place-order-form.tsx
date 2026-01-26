'use client';

import { Button } from '@/components/ui/button';
import { createOrder } from '@/lib/actions/order.actions';
import { Check, Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useFormStatus } from 'react-dom';

export default function PlaceOrderForm() {
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const res = await createOrder();

    if (res.redirectTo) {
      router.push(res.redirectTo);
    }
  };

  const PlaceOrderButton = () => {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" disabled={pending}>
        {pending ? (
          <Loader className="animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}{' '}
        Place Order
      </Button>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <PlaceOrderButton />
    </form>
  );
}
