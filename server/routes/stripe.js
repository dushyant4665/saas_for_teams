const express = require('express');
const { verifyToken } = require('../middleware/auth');
const stripe = require('../config/stripe');
const User = require('../models/User');

const router = express.Router();

// Demo stripe checkout without auth
router.post('/demo-checkout', (req, res) => {
  try {
    const { priceId = 'price_test123' } = req.body;
    
    res.json({
      sessionId: 'cs_test_demo_session_123456789',
      url: 'https://checkout.stripe.com/demo',
      message: 'Demo checkout session created'
    });
  } catch (error) {
    console.error('Demo checkout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create Stripe Checkout Session
router.post('/create-checkout', verifyToken, async (req, res) => {
  try {
    const { priceId = 'price_1234567890' } = req.body; // Default test price ID
    
    // For demo purposes, return mock response
    if (process.env.STRIPE_SECRET_KEY.includes('test_key_for_demo')) {
      return res.json({
        sessionId: 'cs_test_demo_session_123456789',
        url: 'https://checkout.stripe.com/demo'
      });
    }
    
    let customerId = req.user.subscription.stripeCustomerId;
    
    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.displayName,
        metadata: {
          firebaseUid: req.user.firebaseUid,
          userId: req.user._id.toString()
        }
      });
      
      customerId = customer.id;
      
      // Update user with customer ID
      await User.findByIdAndUpdate(req.user._id, {
        'subscription.stripeCustomerId': customerId
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard`,
      metadata: {
        userId: req.user._id.toString(),
        firebaseUid: req.user.firebaseUid
      }
    });

    res.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create billing portal session
router.post('/create-portal', verifyToken, async (req, res) => {
  try {
    const customerId = req.user.subscription.stripeCustomerId;
    
    if (!customerId) {
      return res.status(400).json({ error: 'No customer found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.CLIENT_URL}/dashboard`,
    });

    res.json({
      url: session.url
    });
  } catch (error) {
    console.error('Create portal session error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Get subscription status
router.get('/subscription', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

module.exports = router;

