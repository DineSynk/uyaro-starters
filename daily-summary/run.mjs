#!/usr/bin/env node
// How did the day go?   node daily-summary/run.mjs [YYYY-MM-DD] [--json]
import { configFromEnv, dayInIndia, ordersBetween, summarise, yesterdayInIndia } from '../uyaro.mjs';

const args = process.argv.slice(2);
const date = args.find((arg) => !arg.startsWith('--')) ?? yesterdayInIndia();
const { from, to } = dayInIndia(date);
const summary = summarise(await ordersBetween(configFromEnv(), from, to));

if (args.includes('--json')) {
  console.log(JSON.stringify({ date, ...summary }, null, 2));
} else {
  const rupees = (amount) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const hour = summary.busiestHour;
  console.log(`${date}: ${summary.orders} orders, ${rupees(summary.revenue)} (average bill ${rupees(summary.averageBill)})`);
  if (hour !== null) console.log(`Busiest hour: ${hour}:00 to ${hour + 1}:00 with ${summary.ordersByHour[hour]} orders`);
  console.log('Top items:');
  for (const item of summary.topItems) console.log(`  ${String(item.quantity).padStart(4)} × ${item.name}`);
  console.log(`Paid by: ${Object.entries(summary.payments).map(([method, count]) => `${method} ${count}`).join(', ') || 'nothing recorded'}`);
}
