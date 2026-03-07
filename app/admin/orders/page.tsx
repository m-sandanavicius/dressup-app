import { auth } from '@/auth';
import DeleteDialog from '@/components/shared/delete-dialog';
import Pagination from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from '@/components/ui/table';
import { deleteOrder, getAllOrders } from '@/lib/actions/order.actions';
import { formatId, formatDateTime, formatCurrency } from '@/lib/utils';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Orders - Admin',
};

export default async function AdminOrdersPage(props: {
  searchParams: Promise<{ page: string }>;
}) {
  const { page = '1' } = await props.searchParams;

  const session = await auth();

  if (session?.user.role !== 'admin') throw new Error('Unauthorized');

  const orders = await getAllOrders({
    page: Number(page) || 1,
  });

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
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/orders/${o.id}`} className="px-2 mr-2">
                      Details
                    </Link>
                  </Button>
                  <DeleteDialog id={o.id} action={deleteOrder} />
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
