# Uyaro starters

Small, working examples of things you can build on [Uyaro POS](https://uyaro.in), for you or your AI agent to copy and change.

Every starter here runs right now against the **Uyaro Demo Café**, a made-up café whose sales arrive through the day. Its key is public, so there is nothing to sign up for.

```bash
git clone https://github.com/DineSynk/uyaro-starters && cd uyaro-starters
node daily-summary/run.mjs          # how did the café do yesterday?
```

Needs Node 20 or newer. Nothing to install.

## Starters

| Starter | What it does | Needs |
|---|---|---|
| [`daily-summary`](daily-summary/) | Prints a day's orders, revenue, top items, payment split and busiest hour. A good first job for an agent. | `orders:read` |
| [`sales-dashboard`](sales-dashboard/) | One web page showing the same for any day. No build step. | `orders:read` |

Planned, once the platform allows it:

| Starter | Waiting on |
|---|---|
| Pay on your own site | A test store that can take test payments (payment links and signed webhooks already work for real stores) |
| Menu site | Keys that can read the menu and store details |
| Online ordering | Keys that can place orders |

## Use your own store

Ask the owner of the Uyaro account for a key limited to what the starter needs, then:

```bash
export UYARO_API_KEY=uyr_...            # the key
export UYARO_MERCHANT_ID=...            # your merchant id
export UYARO_STORE_ID=...               # the store the key may read
node daily-summary/run.mjs
```

Keep real keys out of the repo and out of web pages other people can open.

## How the API answers

- Amounts are in **paise**. Divide by 100 for rupees.
- Times are **UTC**. Indian time is UTC+5:30, so a day in India runs from 18:30 UTC the evening before.
- Orders come 100 to a page at most. `uyaro.mjs` walks the pages for you.
- Without `customers:read`, customer details are removed from everything a key reads.
- A key limited to certain stores must name one as `storeId` on every request.

## Check your work

```bash
node --test        # the logic, offline
node check.mjs     # the starters, against the live demo café
```

If you change a starter, both should still pass. If you add one, add its check to `check.mjs`.

## Licence

MIT. Copy these starters into your own project and change them as you like.
