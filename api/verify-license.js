import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(request, response) {
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

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer_id,
      status: 'active',
      limit: 1
    });

    const activeSubscription = subscriptions.data[0];

    if (activeSubscription) {
      const priceId = activeSubscription.items.data[0].price.id;
      const isAnnual = priceId === process.env.STRIPE_ANNUAL_PRICE_ID;
      
      return response.json({ 
        valid: true,
        type: 'subscription',
        customer_id: customer_id,
        plan: isAnnual ? 'annual' : 'monthly',
        current_period_end: activeSubscription.current_period_end,
        price_id: priceId
      });
    } else {
      return response.json({ valid: false, error: 'No active subscription found' });
    }
  } catch (error) {
    console.error('Verification error:', error);
    return response.status(500).json({ valid: false, error: 'Server error' });
  }
}
