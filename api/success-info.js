const Stripe = require('stripe');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { session_id } = req.query;
  
  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    res.json({
      customer_id: session.customer,
      license_key: session.customer, // Using customer ID as license
      product: session.metadata.product,
      success: true
    });
  } catch (error) {
    console.error('Success info error:', error);
    res.status(500).json({ error: error.message });
  }
}