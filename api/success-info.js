import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  
  const { session_id } = request.query;
  
  if (!session_id) {
    return response.status(400).json({ error: 'Missing session_id' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    return response.json({
      customer_id: session.customer,
      license_key: session.customer,
      product: session.metadata.product,
      success: true
    });
  } catch (error) {
    console.error('Success info error:', error);
    return response.status(500).json({ error: error.message });
  }
}
