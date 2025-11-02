import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    const { plan } = request.body; // 'monthly' or 'annual'
    
    let priceId;
    if (plan === 'annual') {
      priceId = process.env.STRIPE_ANNUAL_PRICE_ID; // $69.95/year
    } else {
      priceId = process.env.STRIPE_MONTHLY_PRICE_ID; // $6.95/month (default)
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.CANCEL_URL,
      metadata: {
        product: 'Etsy Scanner Pro',
        plan: plan || 'monthly'
      }
    });

    return response.json({ id: session.id });
  } catch (error) {
    console.error('Checkout error:', error);
    return response.status(500).json({ error: error.message });
  }
}
