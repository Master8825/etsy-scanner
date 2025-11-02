const Stripe = require('stripe');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customer_id } = req.body;
    
    if (!customer_id) {
      return res.status(400).json({ valid: false, error: 'Missing customer_id' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Check for successful payments
    const payments = await stripe.paymentIntents.list({
      customer: customer_id,
      limit: 10,
      status: 'succeeded'
    });

    // Check if any payment is for our product and within last year
    const validPayment = payments.data.find(payment => {
      const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
      const isRecent = payment.created * 1000 > oneYearAgo; // Stripe uses seconds
      return isRecent;
    });

    if (validPayment) {
      res.json({ 
        valid: true,
        type: 'lifetime',
        customer_id: customer_id,
        purchased_at: validPayment.created
      });
    } else {
      res.json({ valid: false, error: 'No valid payment found' });
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ valid: false, error: 'Server error' });
  }
}