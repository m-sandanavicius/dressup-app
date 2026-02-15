import Pagination from '@/components/shared/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getMyOrders } from '@/lib/actions/order.actions';
import { formatCurrency, formatDateTime, formatId } from '@/lib/utils';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'My Orders',
};

export default async function OrdersPage(props: {
  searchParams: Promise<{ page: string }>;
}) {
  const { page } = await props.searchParams;

  const orders = await getMyOrders({
    page: Number(page) || 1,
  });

  console.log(orders);

  return (
    <div className="space-y-2">
      <h2 className="h2-bold">Orders</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>DATE</TableHead>
              <TableHead>TOTAL</TableHead>
              <TableHead>PAID</TableHead>
              <TableHead>DELIVERED</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.data.map((o) => (
              <TableRow key={o.id}>
                <TableCell>{formatId(o.id)}</TableCell>
                <TableCell>{formatDateTime(o.createdAt).dateTime}</TableCell>
                <TableCell>{formatCurrency(o.totalPrice)}</TableCell>

                <TableCell>
                  {o.isPaid && o.paidAt
                    ? formatDateTime(o.paidAt).dateTime
                    : 'Not Paid'}
                </TableCell>
                <TableCell>
                  {o.isDelivered && o.deliveredAt
                    ? formatDateTime(o.deliveredAt).dateTime
                    : 'Not Delivered'}
                </TableCell>
                <TableCell>
                  <Link href={`/orders/${o.id}`} className="px-2">
                    Details
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {orders.totalPages > 1 && (
          <Pagination
            page={Number(page) || 1}
            totalPages={orders?.totalPages}
          />
        )}
      </div>
    </div>
  );
}
