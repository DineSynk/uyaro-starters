# Daily summary

How did the day go? Orders, revenue, average bill, top items, how people paid and the busiest hour.

```bash
node daily-summary/run.mjs                 # yesterday, in India
node daily-summary/run.mjs 2026-11-14      # a chosen day
node daily-summary/run.mjs --json          # for another program or an agent to read
```

```text
2026-11-16: 67 orders, ₹28,066.50 (average bill ₹418.90)
Busiest hour: 13:00 to 14:00 with 10 orders
Top items:
    32 × Filter coffee
    29 × Masala dosa
    ...
Paid by: card 18, upi 41, cash 8
```

**Key needed:** `orders:read`. Customer details are never read.

## Ideas for changing it

- Send the summary to the owner each night by email or chat.
- Compare with the same weekday last week.
- Warn when an item that usually sells has sold nothing by noon.

The reading and summing live in [`../uyaro.mjs`](../uyaro.mjs); `run.mjs` only prints.
