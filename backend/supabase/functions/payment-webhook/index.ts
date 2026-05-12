// Edge Function: payment-webhook
// Receives webhooks from Israeli payment provider (chosen Phase 2).
// Verifies provider signature, writes raw event to payment_events,
// updates subscriptions + payments + invoices accordingly.
// Phase 2

export {};
