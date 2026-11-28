const ALLOWED_ORIGIN = 'https://curierfloresti.github.io';
const ORDERS_STATUS_KEY = 'orders';
const ALLOWED_STORES = ['Bravo', 'Amore Sushi', 'Panda', 'Farmacie', 'Samurai Sushi', 'Davidan', 'Casa perfectă și curată'];
const DELIVERY_FEES = {
  'Florești':55,'Vărvăreuca':60,'Bubulești':80,'Alexeevca':90,'Gura Camencii':90,'Mărculești':100,'Lunga':110,'Gura Căinarului':120,'Cenușa':130,'Roșietici':130,'Ghindești':140,'Prajila':140,'Răduleni Vechi':140,'Rogojeni':140,'Sevirova':150,'Cașunca':160,'Vadeni':160,'Putinești':180,'Ciripcău':190,'Trifănești':190,'Ciutulești':200,'Nicolaevca':210,'Izvoare':230,'Domulgeni':250,'Temeleuți':330,'Ștefănești':350,
};
function parseAmount(value) {
  const amount = Number(value.replace(/[\s\u00a0\u202f]/g, '').replace(',', '.'));
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
}

function getProductSubtotal(entry) {
  const summary = entry.items.match(/^Total (produse|parțial):\s*([\d\s\u00a0\u202f]+(?:[,.]\d{1,2})?)\s*MDL/mu);
  if (summary) {
    const cents = parseAmount(summary[2]);
    return { cents: cents ?? 0, complete: cents !== null && summary[1].toLocaleLowerCase('ro') === 'produse' };
  }

  const lines = entry.items.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  let cents = 0;
  let complete = lines.length > 0;
  for (const line of lines) {
    const match = line.match(/([\d][\d\s\u00a0\u202f]*(?:[,.]\d{1,2})?)\s*(?:MDL|lei)\s*$/i);
    if (!match) {
      complete = false;
      continue;
    }
    const lineCents = parseAmount(match[1]);
    if (lineCents === null) {
      complete = false;
      continue;
    }
    cents += lineCents;
  }

  return { cents, complete };
}

function formatAmount(cents) {
  return new Intl.NumberFormat('ro-MD', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(cents / 100);
}

function parseStorePhoneNumbers(value) {
  if (!value) return {};

  let numbers;
  try {
    numbers = JSON.parse(value);
  } catch {
    throw new Error('Configurarea numerelor magazinelor nu este validă.');
  }
  if (!numbers || typeof numbers !== 'object' || Array.isArray(numbers)) {
    throw new Error('Configurarea numerelor magazinelor nu este validă.');
  }

  for (const [store, contacts] of Object.entries(numbers)) {
    if (!ALLOWED_STORES.includes(store) || !Array.isArray(contacts) || contacts.length > 5
      || contacts.some(contact => !contact || typeof contact.number !== 'string'
        || !/^[+\d\s().-]{5,40}$/u.test(contact.number)
        || (contact.label !== undefined && (typeof contact.label !== 'string' || contact.label.length > 60)))) {
      throw new Error('Configurarea numerelor magazinelor nu este validă.');
    }
  }
  return numbers;
}

function json(body, status = 200, origin = '') {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  if (origin === ALLOWED_ORIGIN) {
    headers['Access-Control-Allow-Origin'] = ALLOWED_ORIGIN;
    headers.Vary = 'Origin';
  }
  return new Response(JSON.stringify(body), { status, headers });
}

async function getOrdersStatus(env) {
  const status = await env.ORDERS_STATUS.get(ORDERS_STATUS_KEY, { type: 'json' });
  if (status === null) return { closed: false, message: 'Comenzile sunt deschise.' };
  if (!status || typeof status.closed !== 'boolean'
    || typeof status.message !== 'string' || status.message.length > 200) {
    throw new Error('Starea comenzilor nu este validă.');
  }
  return status;
}

async function hasAdminPassword(request, env) {
  if (typeof env.ORDERS_ADMIN_PASSWORD !== 'string' || !env.ORDERS_ADMIN_PASSWORD) return false;
  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) return false;
  const supplied = authorization.slice(7);
  if (!supplied || supplied.length > 256) return false;
  const encoder = new TextEncoder();
  const [expectedHash, suppliedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(env.ORDERS_ADMIN_PASSWORD)),
    crypto.subtle.digest('SHA-256', encoder.encode(supplied)),
  ]);
  const expected = new Uint8Array(expectedHash);
  const actual = new Uint8Array(suppliedHash);
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= expected[index] ^ actual[index];
  return difference === 0;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (origin !== ALLOWED_ORIGIN) return json({ ok: false, error: 'Origine nepermisă.' }, 403);
    const pathname = new URL(request.url).pathname.replace(/\/+$/u, '') || '/';
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
          'Access-Control-Max-Age': '86400',
          Vary: 'Origin',
        },
      });
    }
    if (pathname === '/status' && request.method === 'GET') {
      try {
        return json(await getOrdersStatus(env), 200, origin);
      } catch {
        return json({ ok: false, error: 'Nu am putut verifica starea comenzilor.' }, 503, origin);
      }
    }
    if (pathname === '/admin/auth' && request.method === 'POST') {
      if (!env.ORDERS_STATUS || typeof env.ORDERS_ADMIN_PASSWORD !== 'string'
        || env.ORDERS_ADMIN_PASSWORD.length < 14) {
        return json({ ok: false, error: 'Administrarea comenzilor nu este configurată.' }, 503, origin);
      }
      if (!await hasAdminPassword(request, env)) return json({ ok: false, error: 'Parola nu este corectă.' }, 401, origin);
      return json({ ok: true }, 200, origin);
    }
    if (pathname === '/admin/status' && request.method === 'POST') {
      if (!env.ORDERS_STATUS) return json({ ok: false, error: 'Stocarea stării comenzilor nu este configurată.' }, 503, origin);
      if (typeof env.ORDERS_ADMIN_PASSWORD !== 'string' || env.ORDERS_ADMIN_PASSWORD.length < 14) {
        return json({ ok: false, error: 'Configurează o parolă de administrare de cel puțin 14 caractere.' }, 503, origin);
      }
      if (!await hasAdminPassword(request, env)) return json({ ok: false, error: 'Parola nu este corectă.' }, 401, origin);
      let update;
      try {
        update = await request.json();
      } catch {
        return json({ ok: false, error: 'Datele stării comenzilor nu sunt valide.' }, 400, origin);
      }
      if (!update || typeof update.closed !== 'boolean'
        || (update.message !== undefined && (typeof update.message !== 'string' || update.message.length > 200))) {
        return json({ ok: false, error: 'Datele stării comenzilor nu sunt valide.' }, 400, origin);
      }
      const status = {
        closed: update.closed,
        message: update.closed
          ? (typeof update.message === 'string' && update.message.trim() ? update.message.trim() : 'Comenzile sunt închise momentan.')
          : 'Comenzile sunt deschise.',
        updatedAt: new Date().toISOString(),
      };
      try {
        await env.ORDERS_STATUS.put(ORDERS_STATUS_KEY, JSON.stringify(status));
        return json(status, 200, origin);
      } catch {
        return json({ ok: false, error: 'Nu am putut salva starea comenzilor.' }, 503, origin);
      }
    }
    if (pathname !== '/') return json({ ok: false, error: 'Rută negăsită.' }, 404, origin);
    if (request.method !== 'POST') return json({ ok: false, error: 'Metodă nepermisă.' }, 405, origin);
    if (!env.ORDERS_STATUS) return json({ ok: false, error: 'Stocarea stării comenzilor nu este configurată.' }, 503, origin);
    try {
      const status = await getOrdersStatus(env);
      if (status.closed) return json({ ok: false, error: status.message }, 503, origin);
    } catch {
      return json({ ok: false, error: 'Nu am putut verifica starea comenzilor. Încearcă din nou.' }, 503, origin);
    }
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return json({ ok: false, error: 'Serverul Telegram nu este configurat.' }, 503, origin);
    }

    let storePhoneNumbers;
    try {
      storePhoneNumbers = parseStorePhoneNumbers(env.STORE_PHONE_NUMBERS);
    } catch {
      return json({ ok: false, error: 'Configurarea numerelor magazinelor nu este validă.' }, 503, origin);
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

    const baseFee = DELIVERY_FEES[order.locality];
    if (baseFee === undefined) {
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
      if (!entry || typeof entry.store !== 'string' || !ALLOWED_STORES.includes(entry.store)
        || seenStores.has(entry.store) || typeof entry.items !== 'string'
        || !entry.items.trim() || entry.items.length > 3000) {
        return json({ ok: false, error: 'Verifică magazinele și produsele introduse.' }, 400, origin);
      }
      seenStores.add(entry.store);
    }

    const storeSurcharge = Math.max(0, orders.length - 1) * 10;
    const expectedFee = baseFee + storeSurcharge;
    if (order.deliveryFee !== expectedFee) {
      return json({ ok: false, error: 'Localitatea sau prețul livrării nu este valid.' }, 400, origin);
    }

    const subtotals = orders.map(getProductSubtotal);
    const productsCents = subtotals.reduce((sum, subtotal) => sum + subtotal.cents, 0);
    const productsComplete = subtotals.every(subtotal => subtotal.complete);
    const totalCents = productsCents + expectedFee * 100;
    const productAmountLine = productsComplete
      ? `Suma produselor: ${formatAmount(productsCents)} lei`
      : productsCents
        ? `Suma produselor cu preț indicat: ${formatAmount(productsCents)} lei (prețuri lipsă la unele produse)`
        : 'Suma produselor: de confirmat (prețurile nu sunt scrise pentru toate produsele)';
    const paymentTotalLine = productsComplete
      ? `TOTAL DE PLATĂ: ${formatAmount(totalCents)} lei`
      : `TOTAL PARȚIAL: ${formatAmount(totalCents)} lei (nu include produsele fără preț indicat)`;

    const text = [
      '🛍 COMANDĂ NOUĂ',
      ...orders.flatMap(entry => [
        `\n🏬 ${entry.store}`,
        ...(storePhoneNumbers[entry.store] || []).map(contact => `📞 ${contact.label ? `${contact.label}: ` : ''}${contact.number}`),
        entry.items.trim(),
      ]),
      '',
      `Client: ${order.name.trim()}`,
      `Telefon: ${order.phone.trim()}`,
      `Localitate: ${order.locality}`,
      productAmountLine,
      `Livrare: ${expectedFee} lei`,
      storeSurcharge
        ? `Adaos pentru ${orders.length - 1} ${orders.length === 2 ? 'magazin suplimentar' : 'magazine suplimentare'}: ${storeSurcharge} lei`
        : '',
      `Adresă: ${order.street.trim()}`,
      order.details.trim() ? `Detalii: ${order.details.trim()}` : '',
      paymentTotalLine,
    ].filter(Boolean).join('\n');
    const paymentTotalOffset = text.length - paymentTotalLine.length;

    let telegramResponse;
    try {
      telegramResponse = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text,
          entities: [{ type: 'bold', offset: paymentTotalOffset, length: paymentTotalLine.length }],
        }),
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
