// Everything needed to read a store's sales from Uyaro and sum them up. No dependencies.

/** The public demo café. Anyone may read it; it holds invented sales only. */
export const DEMO = {
  apiBase: 'https://v2.api.kioskade.com',
  merchantId: '8495d45b2967600934',
  storeId: '8495d45b2967601735',
  key: 'uyr_demo_public_orders_and_receipts',
};

/** Your own store if the three variables are set, the demo café otherwise. */
export function configFromEnv(env = process.env) {
  return {
    apiBase: env.UYARO_API_BASE ?? DEMO.apiBase,
    merchantId: env.UYARO_MERCHANT_ID ?? DEMO.merchantId,
    storeId: env.UYARO_STORE_ID ?? DEMO.storeId,
    key: env.UYARO_API_KEY ?? DEMO.key,
  };
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Yesterday's date in India, as YYYY-MM-DD. */
export function yesterdayInIndia(now = new Date()) {
  return new Date(now.getTime() + IST_OFFSET_MS - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** The start and end of one day in India, as the UTC instants the API expects. */
export function dayInIndia(date) {
  const start = new Date(`${date}T00:00:00.000Z`).getTime() - IST_OFFSET_MS;
  if (Number.isNaN(start)) throw new Error(`Not a date: ${date}. Use YYYY-MM-DD.`);
  return { from: new Date(start).toISOString(), to: new Date(start + 24 * 60 * 60 * 1000 - 1).toISOString() };
}

/** Every order between two instants. The API gives 100 at most per page, so this walks the pages. */
export async function ordersBetween(config, from, to, fetchImpl = fetch) {
  const orders = [];
  for (let page = 1; ; page += 1) {
    const url = new URL(`${config.apiBase}/orders/query/${config.merchantId}`);
    url.search = new URLSearchParams({ storeId: config.storeId, from, to, page: String(page), limit: '100' }).toString();
    const response = await fetchImpl(url, { headers: { Authorization: `Bearer ${config.key}` } });
    const body = await response.json();
    if (body.status !== 'SUCCESS') {
      throw new Error(`Uyaro refused the request: ${body.errorCodes?.join(', ') ?? response.status} ${body.errorMessage ?? ''}`.trim());
    }
    orders.push(...body.data.orders);
    if (page >= Number(body.data.pagination.totalPages)) return orders;
  }
}

/**
 * Sums a list of orders. Amounts come from Uyaro in paise and leave here in rupees.
 * Cancelled orders are left out.
 */
export function summarise(orders) {
  const sold = orders.filter((order) => order.status !== 'cancelled');
  const items = new Map();
  const payments = {};
  const hours = new Array(24).fill(0);
  let paise = 0;

  for (const order of sold) {
    paise += order.totalOrderAmount?.total ?? 0;
    hours[new Date(new Date(order.date).getTime() + IST_OFFSET_MS).getUTCHours()] += 1;
    for (const line of order.orderLines ?? []) {
      const item = items.get(line.name) ?? { name: line.name, quantity: 0, revenue: 0 };
      item.quantity += line.quantity;
      item.revenue += (line.itemAmount?.total ?? 0) / 100;
      items.set(line.name, item);
    }
    for (const payment of order.payments ?? []) {
      if (payment.status === 'SUCCESS') payments[payment.paymentMethod] = (payments[payment.paymentMethod] ?? 0) + 1;
    }
  }

  const busiest = Math.max(...hours);
  return {
    orders: sold.length,
    revenue: paise / 100,
    averageBill: sold.length ? Math.round(paise / sold.length) / 100 : 0,
    topItems: [...items.values()].sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name)).slice(0, 5),
    payments,
    busiestHour: busiest > 0 ? hours.indexOf(busiest) : null,
    ordersByHour: hours,
  };
}
