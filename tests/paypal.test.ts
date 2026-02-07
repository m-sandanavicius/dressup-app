import { generateAccessToken } from '../lib/paypal';
import { paypal } from '../lib/paypal';

test('generates access token from paypal', async () => {
  const token = await generateAccessToken();
  console.log(token);
  expect(typeof token).toBe('string');
  expect(token).toBeDefined();
});

test('creates an order with paypal', async () => {
  const token = await generateAccessToken();
  const order = await paypal.createOrder(19.99);
  console.log(order);

  expect(order).toHaveProperty('id');
  expect(order).toHaveProperty('status');
  expect(order.status).toBe('CREATED');
});

test('captures payment with paypal', async () => {
  const orderId = '100';
  const mockCapturePayment = jest
    .spyOn(paypal, 'capturePayment')
    .mockResolvedValue({
      status: 'COMPLETED',
    });

  const capture = await paypal.capturePayment(orderId);
  console.log(capture);

  expect(capture.status).toBe('COMPLETED');
  mockCapturePayment.mockRestore();
});
