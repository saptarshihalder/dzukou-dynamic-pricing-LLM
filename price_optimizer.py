#!/usr/bin/env python3
"""Price optimizer for Dzukou products."""

import csv
import os
import re
import statistics
from pathlib import Path
from typing import Dict, List

PRICE_STEP = 0.25  # granularity for optimizer


def clean_prices(prices: List[float]) -> List[float]:
    """Remove outliers and invalid data from scraped prices."""
    valid = [p for p in prices if 0 < p < 1000]
    if len(valid) >= 4:
        q1, q3 = statistics.quantiles(valid, n=4)[0], statistics.quantiles(valid, n=4)[2]
        iqr = q3 - q1
        low = q1 - 1.5 * iqr
        high = q3 + 1.5 * iqr
        valid = [p for p in valid if low <= p <= high]
    return valid


def optimize_price(
    prices: List[float],
    current_price: float,
    unit_cost: float,
    margin: float,
    elasticity: float = 1.2,
    max_markup: float = 1.8,
    price_step: float = PRICE_STEP,
    demand_base: float = 100.0,
) -> float:
    """Search for a price that maximizes estimated profit."""
    base = unit_cost * (1 + margin)
    if not prices:
        return round_price(max(base, current_price))

    avg = statistics.mean(prices)
    min_p = min(prices)
    max_p = max(prices)

    low = max(base, min_p * 0.9, current_price * 0.9)
    high = min(avg * max_markup, max_p * 1.2, current_price * max_markup, base * max_markup)
    if high < low:
        high = low * 1.1

    best_p = base
    best_profit = -1e9
    price = low
    while price <= high:
        profit = simulate_profit(price, unit_cost, avg, demand_base, elasticity)
        if profit > best_profit:
            best_profit = profit
            best_p = price
        price += price_step

    best_p = max(best_p, base)
    return round_price(best_p)

try:
    import requests
except ImportError:  # requests might not be installed; LLM calls become optional
    requests = None


OVERVIEW_CSV = "Dzukou_Pricing_Overview_With_Names - Copy.csv"
MAPPING_CSV = "product_data_mapping.csv"

# Minimum profit margins by category
PROFIT_MARGINS = {
    "Sunglasses": 0.15,
    "Bottles": 0.10,
    "Phone accessories": 0.10,
    "Notebook": 0.10,
    "Lunchbox": 0.10,
    "Premium shawls": 0.30,
    "Eri silk shawls": 0.20,
    "Cotton scarf": 0.15,
    "Other scarves and shawls": 0.15,
    "Cushion covers": 0.20,
    "Coasters & placements": 0.15,
    "Towels": 0.15,
}

# Category-specific demand elasticity (higher values mean more price sensitive)
DEMAND_ELASTICITY = {
    "Sunglasses": 1.3,
    "Bottles": 1.1,
    "Phone accessories": 1.2,
    "Notebook": 1.0,
    "Lunchbox": 1.0,
    "Premium shawls": 0.8,
    "Eri silk shawls": 0.9,
    "Cotton scarf": 1.1,
    "Other scarves and shawls": 1.1,
    "Cushion covers": 1.0,
    "Coasters & placements": 1.0,
    "Towels": 1.0,
}

# Maximum markup relative to the average competitor price
MAX_MARKUP = {
    "Sunglasses": 1.8,
    "Bottles": 1.6,
    "Phone accessories": 1.5,
    "Notebook": 1.5,
    "Lunchbox": 1.6,
    "Premium shawls": 2.0,
    "Eri silk shawls": 1.9,
    "Cotton scarf": 1.7,
    "Other scarves and shawls": 1.7,
    "Cushion covers": 1.6,
    "Coasters & placements": 1.6,
    "Towels": 1.5,
}



def round_price(price: float) -> float:
    """Round price to a corporate-friendly format (e.g., 0.99)."""
    return round(price * 2) / 2 - 0.01

CATEGORY_KEYWORDS = {
    "Sunglasses": ["sunglasses"],
    "Bottles": ["bottle"],
    "Phone accessories": ["phone"],
    "Notebook": ["notebook"],
    "Lunchbox": ["lunchbox"],
    "Premium shawls": ["premium shawl"],
    "Eri silk shawls": ["eri silk"],
    "Cotton scarf": ["cotton scarf"],
    "Other scarves and shawls": ["stole", "shawl", "scarf"],
}


def categorize_product(name: str) -> str:
    name_l = name.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in name_l:
                return category
    return "Other scarves and shawls"  # default to shawls if unknown


def read_overview() -> Dict[str, Dict[str, float]]:
    data = {}
    # The overview CSV may come from Excel and often uses Windows-1252 encoding
    with open(OVERVIEW_CSV, newline="", encoding="cp1252") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row["Product Name"].strip()
            cur_price = float(row[" Current Price "].replace("€", "").strip())
            unit_cost = float(row[" Unit Cost "].replace("€", "").strip())
            data[name] = {"current_price": cur_price, "unit_cost": unit_cost}
    return data


def read_prices(csv_path: Path) -> List[float]:
    prices = []
    with open(csv_path, newline="", encoding="cp1252") as f:
        reader = csv.DictReader(f)
        for row in reader:
            price = row.get("price") or row.get("Price")
            if price:
                price = price.replace("€", "").replace(",", "").strip()
                try:
                    value = float(price)
                except ValueError:
                    continue
                if 0 < value < 1000:
                    prices.append(value)
    return clean_prices(prices)


def call_mistral(prompt: str) -> float:
    """Query the Mistral API and extract a numeric price from the response."""
    if requests is None:
        raise RuntimeError("requests package not installed")
    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        raise RuntimeError("MISTRAL_API_KEY environment variable not set")
    url = "https://api.mistral.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    data = {
        "model": "mistral-large-latest",
        "messages": [{"role": "user", "content": prompt}],
    }
    resp = requests.post(url, headers=headers, json=data, timeout=10)
    resp.raise_for_status()
    content = resp.json()["choices"][0]["message"]["content"]
    match = re.search(r"\d+(?:\.\d+)?", content)
    if not match:
        raise ValueError("No numeric price returned")
    return float(match.group())


def call_groq(prompt: str, model: str | None = None) -> float:
    """Use Groq API to get a numeric price recommendation."""
    if requests is None:
        raise RuntimeError("requests package not installed")
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY environment variable not set")
    if not model:
        model = os.environ.get("GROQ_MODEL", "meta-llama/llama-guard-4-12b")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    data = {"model": model, "messages": [{"role": "user", "content": prompt}]}
    resp = requests.post(url, headers=headers, json=data, timeout=10)
    resp.raise_for_status()
    content = resp.json()["choices"][0]["message"]["content"]
    match = re.search(r"\d+(?:\.\d+)?", content)
    if not match:
        raise ValueError("No numeric price returned")
    return float(match.group())


def call_gemini(prompt: str) -> float:
    """Use Google's Gemini API to get a numeric price recommendation."""
    if requests is None:
        raise RuntimeError("requests package not installed")
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable not set")
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-002:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    data = {"contents": [{"role": "user", "parts": [{"text": prompt}]}]}
    resp = requests.post(url, headers=headers, json=data, timeout=10)
    resp.raise_for_status()
    content = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    match = re.search(r"\d+(?:\.\d+)?", content)
    if not match:
        raise ValueError("No numeric price returned")
    return float(match.group())


def call_llm(prompt: str) -> float:
    """Try multiple LLM providers and return the first successful price."""
    for func in (call_mistral, call_groq, call_gemini):
        try:
            return func(prompt)
        except Exception:
            continue
    raise RuntimeError("No LLM API available")


def simulate_profit(price: float, unit_cost: float, avg_competitor: float, demand_base: float = 100.0, elasticity: float = 1.2) -> float:
    """Simple demand model to estimate profit for backtesting."""
    if price <= 0:
        return 0.0
    demand = demand_base * (avg_competitor / price) ** elasticity
    return demand * (price - unit_cost)




def suggest_price(
    product_name: str,
    category: str,
    prices: List[float],
    cur: float,
    unit: float,
) -> float:
    margin = PROFIT_MARGINS.get(category, 0.15)
    elasticity = DEMAND_ELASTICITY.get(category, 1.2)
    max_markup = MAX_MARKUP.get(category, 1.8)

    if not prices:
        return round_price(max(unit * (1 + margin), cur))

    avg = statistics.mean(prices)
    median = statistics.median(prices)
    stdev = statistics.stdev(prices) if len(prices) > 1 else 0.0
    min_p = min(prices)
    max_p = max(prices)
    prompt = (
        f"Product: {product_name}\n"
        f"Category: {category}\n"
        f"Competitor prices: {', '.join(f'{p:.2f}' for p in prices)}\n"
        f"Average price: {avg:.2f}\n"
        f"Median price: {median:.2f}\n"
        f"Std Dev: {stdev:.2f}\n"
        f"Min price: {min_p:.2f}\n"
        f"Max price: {max_p:.2f}\n"
        f"Current price: {cur:.2f}\n"
        f"Unit cost: {unit:.2f}\n"
        f"Required margin: {margin*100:.0f}%\n"
        "Recommend a competitive selling price that maximizes profit. "
        "Only respond with the number."
    )
    try:
        price = call_llm(prompt)
    except Exception:
        price = optimize_price(
            prices,
            cur,
            unit,
            margin,
            elasticity=elasticity,
            max_markup=max_markup,
        )
    return round_price(price)


def main():
    overview = read_overview()
    results = []
    total_current = 0.0
    total_recommended = 0.0
    with open(MAPPING_CSV, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row["Product Name"].strip()
            data_file = Path(row["Data File"].strip())
            info = overview.get(name)
            if not info:
                continue
            category = categorize_product(name)
            prices = read_prices(data_file)
            price = suggest_price(
                name,
                category,
                prices,
                info["current_price"],
                info["unit_cost"],
            )
            avg = statistics.mean(prices) if prices else info["current_price"]
            median = statistics.median(prices) if prices else info["current_price"]
            stdev = statistics.stdev(prices) if len(prices) > 1 else 0.0
            min_p = min(prices) if prices else info["current_price"]
            max_p = max(prices) if prices else info["current_price"]

            profit_cur = simulate_profit(info["current_price"], info["unit_cost"], avg)
            profit_new = simulate_profit(price, info["unit_cost"], avg)

            total_current += profit_cur
            total_recommended += profit_new

            results.append({
                "Product Name": name,
                "Product ID": row["Product ID"],
                "Recommended Price": f"{price:.2f}",
                "Category": category,
                "Avg Competitor Price": f"{avg:.2f}",
                "Min Competitor Price": f"{min_p:.2f}",
                "Max Competitor Price": f"{max_p:.2f}",
                "Median Competitor Price": f"{median:.2f}",
                "Std Competitor Price": f"{stdev:.2f}",
                "Competitor Count": len(prices),
                "Profit Current": f"{profit_cur:.2f}",
                "Profit Recommended": f"{profit_new:.2f}",
                "Profit Delta": f"{(profit_new - profit_cur):.2f}",
            })
    out_path = Path("recommended_prices.csv")
    with open(out_path, "w", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "Product Name",
                "Product ID",
                "Recommended Price",
                "Category",
                "Avg Competitor Price",
                "Min Competitor Price",
                "Max Competitor Price",
                "Median Competitor Price",
                "Std Competitor Price",
                "Competitor Count",
                "Profit Current",
                "Profit Recommended",
                "Profit Delta",
            ],
        )
        writer.writeheader()
        writer.writerows(results)
    print(f"Saved {len(results)} recommendations to {out_path}")
    print(
        f"Total estimated profit now: {total_current:.2f} -> {total_recommended:.2f} (delta {(total_recommended-total_current):.2f})"
    )


if __name__ == "__main__":
    main()
