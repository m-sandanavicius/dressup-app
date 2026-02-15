'use server';

import { isRedirectError } from 'next/dist/client/components/redirect-error';

import { convertToPlainObject, formatError } from '../utils';
import { auth } from '@/auth';
import { getCart } from './cart.actions';
import { getUserById } from './user.actions';
import { orderSchema } from '../validators';
import { prisma } from '@/db/prisma';
import { CartItem, PaymentResult } from '@/types';
import { paypal } from '../paypal';
import { revalidatePath } from 'next/cache';
import { PAGE_SIZE } from '../constants';
import { Prisma } from '@prisma/client';

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

export async function createPayPalOrder(orderId: string) {
  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId },
    });

    if (!order) throw new Error('Order not found');

    const paypalOrder = await paypal.createOrder(Number(order.totalPrice));

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentResult: {
          id: paypalOrder.id,
          status: '',
          pricePaid: 0,
          email_address: '',
        },
      },
    });

    return {
      success: true,
      message: 'PayPal order created successfully',
      data: paypalOrder.id,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function approvePaypalOrder(
  orderId: string,
  data: { orderId: string },
) {
  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId },
    });

    if (!order) throw new Error('Order not found');

    const captureData = await paypal.capturePayment(data.orderId);

    if (
      !captureData ||
      captureData.id !== (order.paymentResult as PaymentResult)?.id ||
      captureData.status !== 'COMPLETED'
    ) {
      throw new Error('Failed to capture PayPal payment');
    }

    updateOrderToPaid({
      orderId,
      paymentResult: {
        id: captureData.id,
        status: captureData.status,
        pricePaid:
          captureData.purchase_units[0]?.payments.captures[0]?.amount?.value,
        email_address: captureData.payer.email_address,
      },
    });

    revalidatePath(`/order/${orderId}`);

    return {
      success: true,
      message: 'Your order has been paid successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

async function updateOrderToPaid({
  orderId,
  paymentResult,
}: {
  orderId: string;
  paymentResult?: PaymentResult;
}) {
  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId },
      include: {
        orderItems: true,
      },
    });

    if (!order) throw new Error('Order not found');

    if (order.isPaid) throw new Error('Order is already marked as paid');

    await prisma.$transaction(async (tx) => {
      for (const item of order.orderItems) {
        await tx.product.update({
          where: {
            id: item.productId,
          },
          data: {
            stock: { increment: -item.quantity },
          },
        });
      }

      await tx.order.update({
        where: {
          id: orderId,
        },
        data: {
          isPaid: true,
          paidAt: new Date(),
          paymentResult,
        },
      });
    });

    const updatedOrder = await prisma.order.findFirst({
      where: { id: orderId },
      include: {
        orderItems: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!updatedOrder) throw new Error('Failed to update order to paid');
  } catch (error) {
    console.error('Failed to update order to paid:', error);
  }
}

export async function getMyOrders({
  limit = PAGE_SIZE,
  page,
}: {
  limit?: number;
  page: number;
}) {
  const session = await auth();
  if (!session) throw new Error('User is not authorized');

  const orders = await prisma.order.findMany({
    where: { userId: session?.user?.id! },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
  });

  const ordersCount = await prisma.order.count({
    where: { userId: session?.user?.id! },
  });

  return {
    data: orders,
    totalPages: Math.ceil(ordersCount / limit),
  };
}

export { updateOrderToPaid };

type SalesDataType = {
  month: string;
  totalSales: number;
};

export async function gerOrderSummary() {
  const ordersCount = await prisma.order.count();
  const productsCount = await prisma.product.count();
  const usersCount = await prisma.user.count();

  const totalSales = await prisma.order.aggregate({
    _sum: { totalPrice: true },
  });

  const salesDataRaw = await prisma.$queryRaw<
    Array<{ month: string; totalSales: Prisma.Decimal }>
  >`SELECT to_char("created_at", "MM/YY") as "month", sum("totalPrice") as "totalSales" FROM "Order" GROUP BY ("createdAt", "MM/YY")`;

  const salesData: SalesDataType[] = salesDataRaw.map((e) => ({
    month: e.month,
    totalSales: Number(e.totalSales),
  }));

  const latestSales = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true } },
    },
    take: 6,
  });

  return {
    ordersCount,
    productsCount,
    usersCount,
    totalSales,
    latestSales,
    salesData,
  };
}
