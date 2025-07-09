const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkWebhooks() {
  try {
    console.log('🔍 Checking Stripe webhooks...\n');
    
    const webhooks = await stripe.webhooks.list({ limit: 10 });
    
    if (webhooks.data.length === 0) {
      console.log('❌ No webhooks found!');
      console.log('\n📝 To create a webhook, run:');
      console.log('stripe listen --forward-to https://www.retapcard.com/api/webhooks/stripe');
      return;
    }
    
    console.log(`✅ Found ${webhooks.data.length} webhook(s):\n`);
    
    webhooks.data.forEach((webhook, index) => {
      console.log(`${index + 1}. Webhook ID: ${webhook.id}`);
      console.log(`   URL: ${webhook.url}`);
      console.log(`   Status: ${webhook.status}`);
      console.log(`   Events: ${webhook.enabled_events.join(', ')}`);
      console.log(`   Created: ${new Date(webhook.created * 1000).toLocaleString()}`);
      console.log('');
    });
    
    // Check if we have the required events
    const requiredEvents = [
      'checkout.session.completed',
      'customer.subscription.created',
      'payment_intent.succeeded'
    ];
    
    const hasAllEvents = webhooks.data.some(webhook => 
      requiredEvents.every(event => webhook.enabled_events.includes(event))
    );
    
    if (hasAllEvents) {
      console.log('✅ Webhook has all required events');
    } else {
      console.log('❌ Webhook missing required events');
      console.log('Required events:', requiredEvents.join(', '));
    }
    
  } catch (error) {
    console.error('❌ Error checking webhooks:', error.message);
  }
}

// Run the check
checkWebhooks(); 