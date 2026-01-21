import { auth } from '@/auth';
import { getUserById } from '@/lib/actions/user.actions';
import { Metadata } from 'next';
import PaymentMethodForm from './payment-method-form';
import CheckoutSteps from '@/components/shared/checkout-steps';

export const metadata: Metadata = {
  title: 'Payment Method',
  description: 'Select your payment method for your order.',
};

export default async function PaymentMethodPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) throw new Error('User not authenticated');

  const user = await getUserById(userId);

  return (
    <>
      <CheckoutSteps current={2} />
      <PaymentMethodForm prefferedPaymentMethod={user.paymentMethod} />;
    </>
  );
}
