'use server';

import { CartItem } from '@/types';
import { convertToPlainObject, formatError, round2 } from '../utils';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { cartItemSchema, cartSchema } from '../validators';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

const calcPrice = (items: CartItem[]) => {
  const itemsPrice = round2(
    items.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0),
  );

  const shippingPrice = round2(itemsPrice > 100 ? 0 : 20);
  const taxPrice = round2(0.15 * itemsPrice);

  const totalPrice = round2(itemsPrice + shippingPrice + taxPrice);
  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
};

export async function removeItemFromCart(productId: string) {
  try {
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;

    if (!sessionCartId) {
      throw new Error('Cart session not found');
    }

    const cart = await getCart();
    if (!cart) throw new Error('Cart not found');

    const product = await prisma.product.findFirst({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    let foundItem = cart.items.find((i) => i.productId === productId);
    if (!foundItem) throw new Error('Item not found');

    const quantity = foundItem.quantity;

    if (quantity > 1) {
      foundItem.quantity = foundItem.quantity - 1;
    } else if (quantity === 1) {
      cart.items = cart.items.filter((i) => i.productId !== productId);
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        ...cart,
        items: cart.items,
        ...calcPrice(cart.items),
      },
    });

    revalidatePath(`/product/${product.slug}`);

    return {
      success: true,
      message: `${product.name} was removed from cart`,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function addItemToCart(cartItem: CartItem) {
  try {
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;

    if (!sessionCartId) {
      throw new Error('Cart session not found');
    }

    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    const cart = await getCart();

    const item = cartItemSchema.parse(cartItem);

    const product = await prisma.product.findFirst({
      where: { id: item.productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (!cart) {
      const newCart = cartSchema.parse({
        userId: userId,
        items: [item],
        sessionCartId: sessionCartId,
        ...calcPrice([item]),
      });

      await prisma.cart.create({
        data: newCart,
      });

      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} added to cart`,
      };
    } else {
      let existItem = (cart.items as CartItem[]).find(
        (i) => i.productId === item.productId,
      );

      if (existItem) {
        if (product.stock < existItem.quantity + 1) {
          throw new Error('Not enough in stock');
        }

        existItem.quantity = existItem.quantity + 1;
      } else {
        if (product.stock < 1) throw new Error('Not enough in stock');
        cart.items.push(item);
      }

      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: cart.items as Prisma.CartUpdateitemsInput[],
          ...calcPrice(cart.items as CartItem[]),
        },
      });

      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} ${existItem ? 'updated in' : 'added to'} cart`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getCart() {
  const sessionCartId = (await cookies()).get('sessionCartId')?.value;

  if (!sessionCartId) {
    throw new Error('Cart session not found');
  }

  const session = await auth();
  const userId = session?.user?.id ? (session.user.id as string) : undefined;

  const cart = await prisma.cart.findFirst({
    where: userId ? { userId } : { sessionCartId },
  });

  if (!cart) return undefined;

  return convertToPlainObject({
    ...cart,
    items: cart.items as CartItem[],
    itemsPrice: cart.itemsPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
  });
}
