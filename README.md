# DivorceMath

A simple calculator for net worth after a breakup.

Two people, same fields. Pre-relationship capital stays with its owner. What was left from salaries during the years together, plus **all** investment interest from that period, is divided. After the split, each person pays their own spending and keeps their own return rate.

## Inputs (each person)

| Field | Meaning |
|---|---|
| Monthly income | Take-home pay |
| Monthly spending | What they spend on themselves |
| Pays for the other while together | Monthly support; stops after the split |
| Starting investments | Money from *before* the relationship — not split |
| Annual return | Applied monthly to that person's pile (`0` = cash) |

Shared: years together, years to project, her share of acquired assets (default 50%).

Leftover while together:

`income − own spending − what they pay for the other + what the other pays for them`

After the split, support stops, so leftover is `income − own spending`.

## Run locally

Open `index.html` in a browser, or:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## GitHub Pages

1. **Settings → Pages → Build and deployment**
2. Source: **Deploy from a branch**
3. Branch: `master`, folder: `/ (root)`
4. The site will be at [https://denyspiven.github.io/DivorceMath/](https://denyspiven.github.io/DivorceMath/)

## Default scenario

He earns $5,000, spends $1,500 on himself, and pays $1,500 for her. She earns $1,000, spends $1,500, and pays $0 for him — so he covers her living and she saves her full salary. He starts with $60,000 at 10%; she starts at $0, also at 10%. Five years together, 50/50 split of acquired assets, ten-year chart.
