import { getOrderById } from '@/lib/actions/order.actions';
import { Order } from '@/types';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Order Details',
};

export default async function OrderDetailsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const order = (await getOrderById(id)) as Order;

  if (!order) notFound();

  return <>{order.totalPrice}</>;
}
