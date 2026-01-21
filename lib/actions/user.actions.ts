'use server';

import {
  paymentMethodSchema,
  shippingAddressSchema,
  signInFormSchema,
  signUpFormSchema,
} from '../validators';
import { auth, signIn, signOut } from '@/auth';
import { prisma } from '@/db/prisma';
import { hashSync } from 'bcrypt-ts-edge';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { formatError } from '../utils';
import { ShippingAddress } from '@/types';
import z from 'zod';

// Sign in
export async function SignInWithCreds(prevState: unknown, formData: FormData) {
  try {
    const user = signInFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    await signIn('credentials', user);

    return { success: true, message: ' Signed in succesfully' };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return { success: false, message: ' Invalid email or password' };
  }
}

// Sign out
export async function signOutUser() {
  await signOut();
}

// Sign up
export async function signUpUser(prevState: unknown, formData: FormData) {
  try {
    const user = signUpFormSchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    });

    const plainPassword = user.password;

    user.password = hashSync(user.password, 10);

    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
      },
    });

    await signIn('credentials', {
      email: user.email,
      password: plainPassword,
    });

    return {
      success: true,
      message: 'User registered successfully',
    };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return { success: false, message: formatError(error) };
  }
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId },
  });
  if (!user) throw new Error('User not found');

  return user;
}

export async function updateUserAddress(shippingAddress: ShippingAddress) {
  try {
    const session = await auth();

    const user = await prisma.user.findFirst({
      where: { id: session?.user?.id },
    });

    if (!user) throw new Error('User not found');

    const address = shippingAddressSchema.parse(shippingAddress);

    await prisma.user.update({
      where: { id: user.id },
      data: { address },
    });

    return { success: true, message: 'Address updated successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function updateUserPaymentMethod(
  data: z.infer<typeof paymentMethodSchema>,
) {
  try {
    const session = await auth();

    const user = await prisma.user.findFirst({
      where: { id: session?.user?.id },
    });

    if (!user) throw new Error('User not found');

    const paymentMethod = paymentMethodSchema.parse(data);

    await prisma.user.update({
      where: { id: user.id },
      data: { paymentMethod: paymentMethod.type },
    });

    return { success: true, message: 'Payment method updated successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
