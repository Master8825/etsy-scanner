import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(request, response) {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customer_id } = request.body;
    
    if (!customer_id) {
      return response.status(400).json({ valid: false, error: 'Missing customer_id' });
    }

    // Check for successful payments
    const payments = await stripe.paymentIntents.list({
      customer: customer_id,
      limit: 10,
      status: 'succeeded'
    });

    const validPayment = payments.data.find(payment => {
      const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
      const isRecent = payment.created * 1000 > oneYearAgo;
      return isRecent;
    });

    if (validPayment) {
      return response.json({ 
        valid: true,
        type: 'lifetime',
        customer_id: customer_id,
        purchased_at: validPayment.created
      });
    } else {
      return response.json({ valid: false, error: 'No valid payment found' });
    }
  } catch (error) {
    console.error('Verification error:', error);
    return response.status(500).json({ valid: false, error: 'Server error' });
  }
}
