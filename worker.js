const ALLOWED_ORIGIN = 'https://andriangajona-gif.github.io';
const ALLOWED_STORES = ['Bravo', 'Amore Sushi', 'Panda', 'Farmacie', 'Samurai Sushi', 'Davidan'];
const DELIVERY_FEES = {
  'Vărvăreuca': 60,
  'Bubulești': 80,
  'Alexeevca': 90,
  'Gura Camencii': 90,
  'Mărculești': 100,
  'Lunga': 110,
  'Gura Căinarului': 120,
  'Cenușa': 130,
  'Roșietici': 130,
  'Ghindești': 140,
  'Prajila': 140,
  'Răduleni Vechi': 140,
  'Rogojeni': 140,
  'Sevirova': 150,
  'Cașunca': 160,
  'Vadeni': 170,
  'Putinești': 180,
  'Ciripcău': 190,
  'Trifănești': 190,
  'Ciutulești': 200,
  'Nicolaevca': 210,
  'Izvoare': 230,
  'Domulgeni': 250,
  'Temeleuți': 340,
  'Ștefănești': 350,
};

function json(body, status = 200, origin = '') {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  };
  if (origin === ALLOWED_ORIGIN) {
    headers['Access-Control-Allow-Origin'] = ALLOWED_ORIGIN;
    headers['Vary'] = 'Origin';
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
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
    if (request.method !== 'POST') return json({ ok: false, error: 'Metodă nepermisă.' }, 405, origin);
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return json({ ok: false, error: 'Serverul Telegram nu este configurat.' }, 503, origin);
    }

    let order;
    try {
      order = await request.json();
    } catch {
      return json({ ok: false, error: 'Datele comenzii nu sunt valide.' }, 400, origin);
    }

    const limits = { name: 120, phone: 40, locality: 100, street: 200, details: 300 };
    for (const [field, max] of Object.entries(limits)) {
      if (typeof order[field] !== 'string' || (field !== 'details' && !order[field].trim()) || order[field].length > max) {
        return json({ ok: false, error: 'Verifică datele formularului și încearcă din nou.' }, 400, origin);
      }
    }
    if (typeof order.details !== 'string') {
      return json({ ok: false, error: 'Verifică datele formularului și încearcă din nou.' }, 400, origin);
    }

    const expectedFee = DELIVERY_FEES[order.locality];
    if (expectedFee === undefined || order.deliveryFee !== expectedFee) {
      return json({ ok: false, error: 'Localitatea sau prețul livrării nu este valid.' }, 400, origin);
    }

    let orders = order.orders;
    if (!Array.isArray(orders) && typeof order.store === 'string' && typeof order.items === 'string') {
      orders = [{ store: order.store, items: order.items }];
    }
    if (!Array.isArray(orders) || orders.length < 1 || orders.length > ALLOWED_STORES.length) {
      return json({ ok: false, error: 'Adaugă produse pentru cel puțin un magazin.' }, 400, origin);
    }
    const seenStores = new Set();
    for (const entry of orders) {
      if (!entry || typeof entry.store !== 'string' || !ALLOWED_STORES.includes(entry.store) || seenStores.has(entry.store) || typeof entry.items !== 'string' || !entry.items.trim() || entry.items.length > 3000) {
        return json({ ok: false, error: 'Verifică magazinele și produsele introduse.' }, 400, origin);
      }
      seenStores.add(entry.store);
    }

    const text = [
      '🛍 COMANDĂ NOUĂ',
      ...orders.flatMap((entry) => [`\n🏬 ${entry.store}`, entry.items.trim()]),
      '',
      `Client: ${order.name.trim()}`,
      `Telefon: ${order.phone.trim()}`,
      `Localitate: ${order.locality}`,
      `Livrare: ${expectedFee} lei`,
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
      return json({ ok: false, error: 'Nu am putut contacta Telegram. Încearcă din nou.' }, 502, origin);
    }
    const telegramResult = await telegramResponse.json().catch(() => ({}));
    if (!telegramResponse.ok || !telegramResult.ok) {
      return json({ ok: false, error: 'Telegram nu a acceptat mesajul. Verifică configurarea botului.' }, 502, origin);
    }
    return json({ ok: true }, 200, origin);
  },
};
