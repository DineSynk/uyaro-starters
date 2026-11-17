#!/usr/bin/env node
// Proves the starters still work against the live demo café. Run it after any change: node check.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { DEMO, dayInIndia, ordersBetween, summarise, yesterdayInIndia } from './uyaro.mjs';

const date = yesterdayInIndia();
const { from, to } = dayInIndia(date);
const orders = await ordersBetween(DEMO, from, to);
const summary = summarise(orders);

assert.ok(summary.orders >= 50, `the demo café should have a full day of sales on ${date}, got ${summary.orders}`);
assert.ok(orders.every((order) => order.date >= from && order.date <= to), 'every order falls inside the day asked for');
assert.ok(orders.every((order) => !order.customer), 'the public key never returns customer details');
assert.equal(Math.round(summary.revenue * 100), orders.reduce((sum, order) => sum + order.totalOrderAmount.total, 0), 'revenue matches the orders');
assert.equal(summary.ordersByHour.reduce((sum, count) => sum + count, 0), summary.orders, 'every order lands in an hour');

const printed = JSON.parse(execFileSync(process.execPath, ['daily-summary/run.mjs', date, '--json'], { encoding: 'utf8' }));
assert.equal(printed.orders, summary.orders, 'daily-summary prints the same day');

console.log(`ok: ${date}, ${summary.orders} orders, ₹${summary.revenue.toFixed(2)}`);
