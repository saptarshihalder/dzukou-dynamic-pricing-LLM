# Dzukou Dynamic Pricing

This repository contains simple tools to generate pricing recommendations for Dzukou products and visualize the projected profit changes.

## Requirements
- Python 3.10+
- `pandas` and `plotly` for the dashboard
- `requests` (optional) to use external LLM APIs for price suggestions

Install dependencies with:
```bash
pip install pandas plotly requests
```

### Adding products
Run `manage_products.py` to open a small GUI for adding items and category
keywords. The tool now lets you enter the product's current price and unit
cost. It creates an empty CSV file for scraped data, updates
`category_keywords.json`, and appends the pricing info to the overview CSV. It
also modifies `scraper.py` so that new categories are included when scraping
competitor prices.

### A/B testing and Bayesian optimization
`price_optimizer.py` now uses Bayesian optimization via `scikit-optimize` to
search for prices that maximize simulated profit. If the library is not
available, it falls back to the original grid search.

The optimizer also includes a lightweight A/B test simulator. The `run_ab_test`
function compares expected profit between the current and recommended prices
using a stochastic demand model and reports a p-value. Results are stored in the
`recommended_prices.csv` file for quick validation.
