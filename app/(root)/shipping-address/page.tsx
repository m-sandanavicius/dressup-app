import { auth } from '@/auth';
import { getCart } from '@/lib/actions/cart.actions';
import { getUserById } from '@/lib/actions/user.actions';
import { get } from 'http';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import ShippingAddressForm from './shipping-address-form';
import { ShippingAddress } from '@/types';

export const metadata: Metadata = {
  title: 'Shipping Address',
  description: 'Enter your shipping address for your order.',
};

export default async function ShippingAddressPage() {
  const cart = await getCart();

  if (!cart || cart.items.length === 0) redirect('/cart');

  const session = await auth();

  const userId = session?.user?.id;

  if (!userId) throw new Error('User not authenticated');

  const user = await getUserById(userId);

  return <ShippingAddressForm address={user.address as ShippingAddress} />;
}
