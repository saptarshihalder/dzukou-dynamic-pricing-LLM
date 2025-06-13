# Dzukou Dynamic Pricing

This repository contains simple tools to generate pricing recommendations for Dzukou products and visualize the projected profit changes.

## Requirements
- Python 3.10+
- `pandas` and `plotly` for the dashboard
- `requests` (optional) to use external LLM APIs for price suggestions
- `selenium` and `beautifulsoup4` for the scraper

Install dependencies with:
```bash
pip install pandas plotly requests selenium beautifulsoup4
```

### Adding products
Run `manage_products.py` to open a small GUI for adding items and category
keywords. The tool now lets you enter the product's current price and unit
cost. It creates an empty CSV file for scraped data, updates
`category_keywords.json`, and appends the pricing info to the overview CSV.

```bash
python3 manage_products.py
```

## Usage
1. Ensure the mapping file `product_data_mapping.csv` and overview file `Dzukou_Pricing_Overview_With_Names - Copy.csv` are present in the repository.
2. Scrape competitor prices for each category:
```bash
python3 scraper.py
```
   - The scraper saves raw competitor data to CSV files under `product_data/`.
3. Run the optimizer to generate `recommended_prices.csv`:
```bash
python3 price_optimizer.py
```
   - The script tries to query multiple LLM providers using the environment variables `MISTRAL_API_KEY`, `GROQ_API_KEY`, and `GEMINI_API_KEY`. If these variables are not set or `requests` is missing, it falls back to a local price optimizer. The local optimizer now relies on a logistic demand curve and filters competitor prices by category keywords to remove irrelevant items.
4. Create an HTML dashboard to inspect profit deltas:
```bash
python3 dashboard.py
```
   - The dashboard is saved to `dashboard.html` and can be opened in any browser.
   - It now includes interactive charts and uses Bootstrap styling for a cleaner look.


