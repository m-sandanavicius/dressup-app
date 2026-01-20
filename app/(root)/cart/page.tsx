import { getCart } from '@/lib/actions/cart.actions';
import CartTable from './cart-table';

export const metadata = {
  title: 'Shopping Cart',
};

export default async function CartPage() {
  const cart = await getCart();

  return (
    <div>
      <CartTable cart={cart} />
    </div>
  );
}
