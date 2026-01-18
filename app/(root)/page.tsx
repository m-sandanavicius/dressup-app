import ProductList from '@/components/shared/products/product-list';
import { getLatestProducts } from '@/lib/actions/product.actions';

export default async () => {
  const latestProducts = await getLatestProducts();

  return (
    <ProductList data={latestProducts} title="Newest Arrivals" limit={4} />
  );
};
