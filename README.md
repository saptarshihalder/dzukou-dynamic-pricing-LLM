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

## Usage
1. Ensure the mapping file `product_data_mapping.csv` and overview file `Dzukou_Pricing_Overview_With_Names - Copy.csv` are present in the repository.
2. Run the optimizer to generate `recommended_prices.csv`:
```bash
python3 price_optimizer.py
```
   - The script tries to query multiple LLM providers using the environment variables `MISTRAL_API_KEY`, `GROQ_API_KEY`, and `GEMINI_API_KEY`. If these variables are not set or `requests` is missing, it falls back to a local price optimizer. The local optimizer now relies on a logistic demand curve and filters competitor prices by category keywords to remove irrelevant items.
3. Create an HTML dashboard to inspect profit deltas:
```bash
python3 dashboard.py
```
   - The dashboard is saved to `dashboard.html` and can be opened in any browser.


