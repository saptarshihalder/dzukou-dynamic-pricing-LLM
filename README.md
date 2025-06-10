# Dzukou Dynamic Pricing

This repository contains tools to generate pricing recommendations for Dzukou products and visualize the projected profit changes.

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
   - The script tries to query multiple LLM providers using the environment variables `MISTRAL_API_KEY`, `GROQ_API_KEY`, and `GEMINI_API_KEY`. If these variables are not set or `requests` is missing, it falls back to a local price optimizer.
3. Create an HTML dashboard to inspect profit deltas:
```bash
python3 dashboard.py
```
   - The dashboard is saved to `dashboard.html` and can be opened in any browser.

## Price bounds
Pricing limits are controlled by two dictionaries in `price_optimizer.py`:
`MAX_INCREASE` sets the maximum allowed increase over the current price and
`MAX_DECREASE` sets the maximum allowed reduction. These ensure recommended
prices do not swing too drastically in either direction.


