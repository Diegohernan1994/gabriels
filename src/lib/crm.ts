export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  benefits: string[];
  /**
   * Paste Gabriel's Stripe Payment Link or GoHighLevel Checkout URL here.
   * Leave empty ('') to run in preview mode (captures lead and shows confirmation).
   */
  checkoutUrl: string;
}

export const THANK_YOU_URL = '/thank-you/';
export const LANDING_SLUG = 'gabriels-auto-memberships';

/**
 * Membership tiers shown on /memberships/ and Home.
 * Update prices, benefits, and checkoutUrl once Gabriel confirms his Stripe/GHL links.
 */
export const plans: MembershipPlan[] = [
  {
    id: 'essential',
    name: 'Essential',
    price: 19,
    interval: 'month',
    benefits: [
      'Annual vehicle inspection',
      'Tire pressure checks',
      'Fluid level checks',
      'Maintenance reminders',
    ],
    checkoutUrl: '',
  },
  {
    id: 'everyday',
    name: 'Everyday',
    price: 39,
    interval: 'month',
    benefits: [
      'Everything in Essential',
      'Two oil changes per year',
      'One tire rotation per year',
      'Maintenance reminders',
    ],
    checkoutUrl: '',
  },
  {
    id: 'complete',
    name: 'Complete',
    price: 59,
    interval: 'month',
    benefits: [
      'Everything in Everyday',
      'Annual alignment check',
      'Priority appointment requests',
      'Maintenance reminders',
    ],
    checkoutUrl: '',
  },
];

/**
 * Security standard: Inverted Base64 chunks (8-9 chars each). Never store a plain webhook URL.
 * Generate chunks in Node.js once Gabriel's GHL Inbound Webhook URL is ready:
 *   node -e "const u='YOUR_GHL_WEBHOOK_URL'; console.log(JSON.stringify(Buffer.from(u).toString('base64').match(/.{1,9}/g).reverse()))"
 * Paste the resulting array here, in functions/api/submit-lead.js, and in public/api/submit-lead.php.
 */
const WEBHOOK_CHUNKS: string[] = [];

export function getWebhookEndpoint(): string {
  if (typeof atob === 'undefined' || !WEBHOOK_CHUNKS.length) return '';
  try {
    return atob([...WEBHOOK_CHUNKS].reverse().join(''));
  } catch {
    return '';
  }
}

export interface LeadInput {
  name: string;
  email: string;
  phone: string;
  zip?: string;
  interest: string;
  vehicle?: string;
  plan_name?: string;
  plan_price?: string;
  message?: string;
  sms_opt_in: boolean;
  form_source: 'membership_enrollment' | 'contact_inquiry';
}

export function buildLeadPayload(input: LeadInput) {
  const now = new Date();
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const pageTitle = typeof document !== 'undefined' ? document.title.trim() : '';
  const urlParams =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();

  const cleanName = input.name.trim();
  const cleanEmail = input.email.trim();
  const cleanPhone = input.phone.trim();
  const cleanZip = (input.zip || '').trim();
  const cleanInterest = input.interest.trim();

  return {
    full_name: cleanName,
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    zip_code: cleanZip,
    zip: cleanZip,
    Interest: cleanInterest,
    interest: cleanInterest,
    vehicle: (input.vehicle || '').trim(),
    plan_name: (input.plan_name || '').trim(),
    plan_price: (input.plan_price || '').trim(),
    message: (input.message || '').trim(),
    form_source: input.form_source,
    sms_opt_in: input.sms_opt_in ? 'Yes' : 'No',
    landing: LANDING_SLUG,
    Url: currentUrl,
    Title: pageTitle,
    utm_source: urlParams.get('utm_source') || '',
    utm_medium: urlParams.get('utm_medium') || '',
    utm_campaign: urlParams.get('utm_campaign') || '',
    utm_content: urlParams.get('utm_content') || '',
    utm_term: urlParams.get('utm_term') || '',
    submission_date_time:
      now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }) + ' (PT)',
    submission_date_iso: now.toISOString(),
    user_timezone:
      typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : '',
    screen_resolution:
      typeof window !== 'undefined'
        ? `${window.screen.width}x${window.screen.height}`
        : '',
  };
}

export async function submitLeadToCRM(input: LeadInput): Promise<{ sent: boolean; mode: 'live' | 'preview' }> {
  const payload = buildLeadPayload(input);
  let sent = false;

  // Layer 1: Cloudflare Pages Function (/api/submit-lead)
  try {
    const cfRes = await fetch('/api/submit-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    if (cfRes.ok) {
      const json = await cfRes.json().catch(() => ({}));
      if (json.success) sent = true;
    }
  } catch {
    // Fallback to next layer
  }

  // Layer 2: GoDaddy / Apache PHP Proxy (/api/submit-lead.php)
  if (!sent) {
    try {
      const phpRes = await fetch('/api/submit-lead.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (phpRes.ok) {
        const json = await phpRes.json().catch(() => ({}));
        if (json.success) sent = true;
      }
    } catch {
      // Fallback to direct RAM-reconstructed webhook
    }
  }

  // Layer 3: Direct fallback to RAM-reconstructed webhook
  const target = getWebhookEndpoint();
  if (!sent && target) {
    try {
      await fetch(target, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      sent = true;
    } catch {
      // Ignore network errors so user flow never blocks
    }
  }

  return { sent, mode: sent || Boolean(target) ? 'live' : 'preview' };
}

export function buildCheckoutRedirectUrl(baseUrl: string, input: { email: string; name: string; phone: string }): string {
  const url = new URL(baseUrl);
  if (input.email.trim()) {
    url.searchParams.set('prefilled_email', input.email.trim());
    url.searchParams.set('email', input.email.trim());
  }
  if (input.name.trim()) url.searchParams.set('name', input.name.trim());
  if (input.phone.trim()) url.searchParams.set('phone', input.phone.trim());
  return url.toString();
}
