import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEMO, dayInIndia, ordersBetween, summarise, yesterdayInIndia } from './uyaro.mjs';

const order = (date, lines, method, status = 'completed') => ({
  date,
  status,
  orderLines: lines.map(([name, quantity, total]) => ({ name, quantity, itemAmount: { total } })),
  totalOrderAmount: { total: lines.reduce((sum, [, , total]) => sum + total, 0) },
  payments: [{ status: 'SUCCESS', paymentMethod: method }],
});

test('a day in India starts at 18:30 UTC the evening before', () => {
  assert.deepEqual(dayInIndia('2026-11-16'), { from: '2026-11-15T18:30:00.000Z', to: '2026-11-16T18:29:59.999Z' });
  assert.throws(() => dayInIndia('yesterday'), /Not a date/);
});

test('yesterday is counted in India, not in UTC', () => {
  // 19:00 UTC on the 16th is already the 17th in India, so yesterday is the 16th.
  assert.equal(yesterdayInIndia(new Date('2026-11-16T19:00:00.000Z')), '2026-11-16');
  assert.equal(yesterdayInIndia(new Date('2026-11-16T10:00:00.000Z')), '2026-11-15');
});

test('orders are summed in rupees, by item, payment and Indian hour, without cancelled ones', () => {
  const summary = summarise([
    order('2026-11-16T03:00:00.000Z', [['Filter coffee', 2, 18900], ['Masala dosa', 1, 16800]], 'upi'), // 8:30am IST
    order('2026-11-16T03:20:00.000Z', [['Filter coffee', 1, 9450]], 'cash'), // 8:50am IST
    order('2026-11-16T07:40:00.000Z', [['Cold brew', 1, 21000]], 'upi'), // 1:10pm IST
    order('2026-11-16T07:45:00.000Z', [['Cold brew', 5, 105000]], 'card', 'cancelled'),
  ]);
  assert.equal(summary.orders, 3);
  assert.equal(summary.revenue, 661.5);
  assert.equal(summary.averageBill, 220.5);
  assert.deepEqual(summary.topItems.map((item) => [item.name, item.quantity]), [['Filter coffee', 3], ['Cold brew', 1], ['Masala dosa', 1]]);
  assert.deepEqual(summary.payments, { upi: 2, cash: 1 });
  assert.equal(summary.busiestHour, 8);
});

test('a day with no orders is all zeroes, not an error', () => {
  assert.deepEqual(summarise([]), { orders: 0, revenue: 0, averageBill: 0, topItems: [], payments: {}, busiestHour: null, ordersByHour: new Array(24).fill(0) });
});

test('every page is fetched, with the key in the header, and a refusal is reported in words', async () => {
  const seen = [];
  const pages = (url, init) => {
    seen.push([new URL(url).searchParams.get('page'), init.headers.Authorization]);
    const page = Number(new URL(url).searchParams.get('page'));
    return { json: async () => ({ status: 'SUCCESS', data: { orders: [{ id: page }], pagination: { totalPages: '3' } } }) };
  };
  const orders = await ordersBetween(DEMO, 'a', 'b', pages);
  assert.deepEqual(orders, [{ id: 1 }, { id: 2 }, { id: 3 }]);
  assert.deepEqual(seen, [['1', `Bearer ${DEMO.key}`], ['2', `Bearer ${DEMO.key}`], ['3', `Bearer ${DEMO.key}`]]);

  const refused = () => ({ status: 403, json: async () => ({ status: 'ERROR', errorCodes: ['ORDER_QUERY_STORE_NOT_ALLOWED'], errorMessage: 'Pass a storeId' }) });
  await assert.rejects(ordersBetween(DEMO, 'a', 'b', refused), /ORDER_QUERY_STORE_NOT_ALLOWED Pass a storeId/);
});
