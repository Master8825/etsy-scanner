import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(request, response) {
  // Enable CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ 
      error: 'Method not allowed', 
      allowed: ['POST'] 
    });
  }

  try {
    console.log('Creating checkout session...');
    
    // Parse request body - handle both raw string and parsed JSON
    let body = {};
    if (typeof request.body === 'string') {
      try {
        body = JSON.parse(request.body);
      } catch (parseError) {
        return response.status(400).json({ 
          error: 'Invalid JSON in request body' 
        });
      }
    } else if (typeof request.body === 'object') {
      body = request.body;
    }
    
    const { plan = 'monthly' } = body;
    
    console.log('Plan selected:', plan);
    
    // Determine price ID
    let priceId;
    if (plan === 'annual') {
      priceId = process.env.STRIPE_ANNUAL_PRICE_ID;
      console.log('Using annual price ID');
    } else {
      priceId = process.env.STRIPE_MONTHLY_PRICE_ID;
      console.log('Using monthly price ID');
    }

    // Validate price ID exists
    if (!priceId) {
      return response.status(500).json({ 
        error: 'Price ID not configured' 
      });
    }

    // Create Stripe checkout session
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
        plan: plan
      }
    });

    console.log('Checkout session created:', session.id);
    
    return response.json({ 
      id: session.id,
      url: `https://checkout.stripe.com/pay/${session.id}` 
    });

  } catch (error) {
    console.error('Checkout error:', error);
    
    return response.status(500).json({ 
      error: error.message,
      type: error.type || 'Unknown error'
    });
  }
}
