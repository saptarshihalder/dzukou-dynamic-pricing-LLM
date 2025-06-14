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
`category_keywords.json`, and appends the pricing info to the overview CSV.
