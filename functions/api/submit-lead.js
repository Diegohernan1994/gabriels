// Cloudflare Pages Function proxy for Gabriel's Auto Service (GHL / CRM Webhook)
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();

    // Inverted Base64 chunks fallback (replace [] with generated chunks or set GHL_WEBHOOK_URL in Cloudflare env)
    const _p = [];
    const targetWebhook =
      env.GHL_WEBHOOK_URL ||
      (_p.length ? atob([..._p].reverse().join('')) : '');

    if (!targetWebhook) {
      return new Response(JSON.stringify({ success: false, mode: 'preview' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const pstDateString =
      now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }) + ' (PT)';

    const payload = {
      ...data,
      Interest: (data.Interest || data.interest || '').trim(),
      Url: (data.Url || data.url || request.headers.get('referer') || '').trim(),
      Title: (data.Title || data.title || '').trim(),
      submission_date_time: pstDateString,
      submission_date_iso: now.toISOString(),
      client_ip: request.headers.get('cf-connecting-ip') || '',
      user_agent: request.headers.get('user-agent') || '',
    };

    const upstream = await fetch(targetWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return new Response(JSON.stringify({ success: upstream.ok }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ success: false }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
