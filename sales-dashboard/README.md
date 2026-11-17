# Sales dashboard

One web page: revenue, orders, average bill, orders by hour, top items and how people paid, for any day.

```bash
npx serve .            # or: python3 -m http.server, from the repo root
# open http://localhost:3000/sales-dashboard/
```

It is a single HTML file with no build step. It reads the Uyaro API straight from the browser and reuses [`../uyaro.mjs`](../uyaro.mjs).

**Key needed:** `orders:read`.

## Before you point it at a real store

A key in a web page can be read by anyone who opens the page. That is fine for the demo café, and for a page only the owner opens on their own machine. For anything public, keep the key on a server you control and have the page ask that server.
