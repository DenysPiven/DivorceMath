# DivorceMath

A simple calculator for net worth after a breakup.

The chart assumes the couple **stays together** and keeps earning. Each year is a what-if: leftover salary plus all investment interest would be split, and the dots show who would gain or lose from a divorce that year. Pre-relationship capital is not split.

## Inputs (each person)

| Field | Meaning |
|---|---|
| Monthly income | Take-home pay |
| Monthly spending | What they spend on themselves |
| Pays for the other while together | Monthly support; stops if they divorce |
| Starting investments | Money from *before* the relationship — not split |
| Annual return | Applied monthly to that person's pile (`0` = cash) |

Shared: years to project, her share of acquired assets (default 50%, used only for the yearly divorce what-ifs).

Leftover while together:

`income − own spending − what they pay for the other + what the other pays for them`

## Run locally

Open `index.html` in a browser, or:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## GitHub Pages

The site is at [https://denyspiven.github.io/DivorceMath/](https://denyspiven.github.io/DivorceMath/)

## Default scenario

He earns $5,000, spends $1,500 on himself, and pays $1,500 for her. She earns $1,000, spends $1,500, and pays $0 for him — so he covers her living and she saves her full salary. Both start at 10% return; he has $60,000 already, she has $0. Ten-year chart, 50/50 split of acquired assets if they divorced in any given year.
