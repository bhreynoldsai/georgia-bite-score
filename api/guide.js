// Vercel Edge Function: streaming proxy for the "Ask the guide" panel.
//
// The browser can't call the Anthropic API directly (CORS + no safe place for
// a key on a static host), so the client POSTs { system, user } here and we
// relay Anthropic's SSE stream back verbatim. The client already parses
// Anthropic's event format, so no re-encoding is needed.
//
// Setup: set ANTHROPIC_API_KEY in the Vercel project's environment variables.
// Without it this returns 503 and the client renders its offline fallback.

export const config = { runtime: 'edge' };

const MAX_FIELD_CHARS = 6000;

export default async function handler(req) {
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return json({ error: 'guide not configured' }, 503);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid JSON body' }, 400);
  }

  const { system, user } = body || {};
  if (
    typeof system !== 'string' || typeof user !== 'string' ||
    !system.trim() || !user.trim() ||
    system.length > MAX_FIELD_CHARS || user.length > MAX_FIELD_CHARS
  ) {
    return json({ error: 'expected { system, user } strings' }, 400);
  }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 1000,
      system,
      messages: [{ role: 'user', content: user }],
      stream: true,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    return json({ error: `upstream ${upstream.status}` }, 502);
  }

  return new Response(upstream.body, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
    },
  });
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
