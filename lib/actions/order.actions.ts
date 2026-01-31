'use server';

import { isRedirectError } from 'next/dist/client/components/redirect-error';

import { convertToPlainObject, formatError } from '../utils';
import { auth } from '@/auth';
import { getCart } from './cart.actions';
import { getUserById } from './user.actions';
import { orderSchema } from '../validators';
import { prisma } from '@/db/prisma';
import { CartItem } from '@/types';

export async function createOrder() {
  try {
    const session = await auth();

    if (!session) throw new Error('User not authenticated');

    const cart = await getCart();

    const userId = session.user?.id;

    if (!userId) throw new Error('User not authenticated');

    const user = await getUserById(userId);

    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        message: 'Your cart is empty',
        redirectTo: '/cart',
      };
    }

    if (!user.address) {
      return {
        success: false,
        message: 'No shipping address found',
        redirectTo: '/shipping-address',
      };
    }

    if (!user.paymentMethod) {
      return {
        success: false,
        message: 'No payment method found',
        redirectTo: '/payment-method',
      };
    }

    const order = orderSchema.parse({
      userId: userId,
      shippingAddress: user.address,
      paymentMethod: user.paymentMethod,
      itemsPrice: cart.itemsPrice,
      shippingPrice: cart.shippingPrice,
      taxPrice: cart.taxPrice,
      totalPrice: cart.totalPrice,
    });

    const insertedOrderId = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: order,
      });

      for (const item of cart.items as CartItem[]) {
        await tx.orderItem.create({
          data: {
            ...item,
            orderId: newOrder.id,
            price: item.price,
          },
        });
      }

      await tx.cart.delete({
        where: { id: cart.id },
      });
      return newOrder.id;
    });

    if (!insertedOrderId) throw new Error('Failed to create order');

    return {
      success: true,
      message: 'Order created successfully',
      redirectTo: `/order/${insertedOrderId}`,
    };
  } catch (error) {
    if (isRedirectError(error)) throw new Error('Redirect Error');
    return { success: false, message: formatError(error) };
  }
}

export async function getOrderById(orderId: string) {
  const session = await auth();

  if (!session) throw new Error('User not authenticated');

  const userId = session.user?.id;

  if (!userId) throw new Error('User not authenticated');

  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      orderItems: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!order) throw new Error('Order not found');

  return convertToPlainObject(order);
}
