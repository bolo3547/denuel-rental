import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

/**
 * Get or initialize Stripe client
 * Defers initialization until runtime to avoid build errors
 */
function getStripeClient(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  
  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not configured');
  }
  
  return new Stripe(apiKey, {
    apiVersion: '2024-06-20' as any,
  });
}

export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment processing is not configured. Please contact support.' },
        { status: 503 }
      );
    }
    
    const stripe = getStripeClient();
    const { amount, description } = await req.json(); // amount in ZMW, convert to cents

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // ZMW to ngwee (100 ngwee = 1 ZMW)
      currency: 'zmw',
      description,
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (e: any) {
    console.error('Stripe payment intent error:', e);
    
    // Return user-friendly error messages
    if (e.message?.includes('STRIPE_SECRET_KEY')) {
      return NextResponse.json(
        { error: 'Payment processing is temporarily unavailable' },
        { status: 503 }
      );
    }
    
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}