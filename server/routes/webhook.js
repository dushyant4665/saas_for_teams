const express = require('express');
const stripe = require('../config/stripe');
const User = require('../models/User');

const router = express.Router();

// Stripe webhook endpoint
router.post('/', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

async function handleCheckoutCompleted(session) {
  console.log('Checkout session completed:', session.id);
  
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  // Get the subscription
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  
  await User.findByIdAndUpdate(userId, {
    'subscription.status': 'pro',
    'subscription.stripeSubscriptionId': subscription.id,
    'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000)
  });
}

async function handleSubscriptionCreated(subscription) {
  console.log('Subscription created:', subscription.id);
  
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = customer.metadata?.userId;
  
  if (!userId) {
    console.error('No userId in customer metadata');
    return;
  }

  await User.findByIdAndUpdate(userId, {
    'subscription.status': 'pro',
    'subscription.stripeSubscriptionId': subscription.id,
    'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000)
  });
}

async function handleSubscriptionUpdated(subscription) {
  console.log('Subscription updated:', subscription.id);
  
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = customer.metadata?.userId;
  
  if (!userId) {
    console.error('No userId in customer metadata');
    return;
  }

  const status = subscription.status === 'active' ? 'pro' : 'free';
  
  await User.findByIdAndUpdate(userId, {
    'subscription.status': status,
    'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000)
  });
}

async function handleSubscriptionDeleted(subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = customer.metadata?.userId;
  
  if (!userId) {
    console.error('No userId in customer metadata');
    return;
  }

  await User.findByIdAndUpdate(userId, {
    'subscription.status': 'free',
    'subscription.stripeSubscriptionId': null,
    'subscription.currentPeriodEnd': null
  });
}

async function handlePaymentSucceeded(invoice) {
  console.log('Payment succeeded:', invoice.id);
  
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = customer.metadata?.userId;
  
  if (!userId) {
    console.error('No userId in customer metadata');
    return;
  }

  await User.findByIdAndUpdate(userId, {
    'subscription.status': 'pro',
    'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000)
  });
}

async function handlePaymentFailed(invoice) {
  console.log('Payment failed:', invoice.id);
  
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = customer.metadata?.userId;
  
  if (!userId) {
    console.error('No userId in customer metadata');
    return;
  }

  // Don't immediately downgrade - let Stripe handle retries
  console.log('Payment failed for user:', userId);
}

module.exports = router;

