const ALLOWED_ORIGIN = 'https://andriangajona-gif.github.io';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    if (origin !== ALLOWED_ORIGIN) return json({ ok: false, error: 'Origine nepermisă.' }, 403);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
          'Vary': 'Origin',
        },
      });
    }
    if (request.method !== 'POST') return json({ ok: false, error: 'Metodă nepermisă.' }, 405);
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return json({ ok: false, error: 'Serverul Telegram nu este configurat.' }, 503);
    }

    let order;
    try {
      order = await request.json();
    } catch {
      return json({ ok: false, error: 'Datele comenzii nu sunt valide.' }, 400);
    }

    const limits = { store: 80, items: 3000, name: 120, phone: 40, locality: 120, street: 200, details: 300 };
    for (const [field, max] of Object.entries(limits)) {
      if (typeof order[field] !== 'string' || order[field].trim().length === 0 && field !== 'details' || order[field].length > max) {
        return json({ ok: false, error: 'Verifică datele formularului și încearcă din nou.' }, 400);
      }
    }

    const allowedStores = ['Bravo', 'Amore Sushi', 'Panda', 'Farmacie', 'Samurai Sushi', 'Davidan'];
    if (!allowedStores.includes(order.store)) {
      return json({ ok: false, error: 'Magazinul selectat nu este valid.' }, 400);
    }

    const text = [
      '🛍 COMANDĂ NOUĂ',
      `Magazin: ${order.store.trim()}`,
      '',
      `Produse: ${order.items.trim()}`,
      '',
      `Client: ${order.name.trim()}`,
      `Telefon: ${order.phone.trim()}`,
      `Localitate: ${order.locality.trim()}`,
      `Adresă: ${order.street.trim()}`,
      order.details.trim() ? `Detalii: ${order.details.trim()}` : '',
    ].filter(Boolean).join('\n');

    let telegramResponse;
    try {
      telegramResponse = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }),
      });
    } catch {
      return json({ ok: false, error: 'Nu am putut contacta Telegram. Încearcă din nou.' }, 502);
    }

    const telegramResult = await telegramResponse.json().catch(() => ({}));
    if (!telegramResponse.ok || !telegramResult.ok) {
      return json({ ok: false, error: 'Telegram nu a acceptat mesajul. Verifică configurarea botului.' }, 502);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Vary': 'Origin',
      },
    });
  },
};
