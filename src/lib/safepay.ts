const PUBLIC_KEY = process.env.SAFEPAY_PUBLIC_KEY || '';
const SECRET_KEY = process.env.SAFEPAY_SECRET_KEY || '';
const IS_SANDBOX = process.env.SAFEPAY_SANDBOX === 'true';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const getBaseUrl = () =>
  IS_SANDBOX
    ? 'https://sandbox.api.getsafepay.com'
    : 'https://api.getsafepay.com';

// Create payment tracker token
export const createPaymentTracker = async (
  amount: number,
  orderId: string
): Promise<{ token: string; checkoutUrl: string }> => {
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/order/v1/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client: PUBLIC_KEY,
      secret: SECRET_KEY,
      amount: Math.round(amount),
      currency: 'PKR',
      environment: IS_SANDBOX ? 'sandbox' : 'production',
      order_id: orderId,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data?.data?.token) {
    console.error('Safepay init error:', JSON.stringify(data));
    throw new Error(data?.status?.message || 'Failed to create payment');
  }

  const token = data.data.token;
  console.log('Safepay token:', token);

  // Build checkout URL
  const params = new URLSearchParams({
    env: IS_SANDBOX ? 'sandbox' : 'production',
    beacon: token,
    order_id: orderId,
    source: 'custom',
  });

  const checkoutUrl = `${baseUrl}/checkout?${params.toString()}`;

  return { token, checkoutUrl };
};