import csv
import statistics
import os
from pathlib import Path
from typing import List, Dict


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
    return prices


def fallback_price(avg: float, min_p: float, cur: float, unit: float, margin: float) -> float:
    base = unit * (1 + margin)
    return max(base, cur * 1.05, avg, min_p * 1.1)




def suggest_price(product_name: str, prices: List[float], cur: float, unit: float, margin: float) -> float:
    if not prices:
        return max(unit * (1 + margin), cur)
    avg = statistics.mean(prices)
    min_p = min(prices)
    return fallback_price(avg, min_p, cur, unit, margin)


def main():
    overview = read_overview()
    results = []
    with open(MAPPING_CSV, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row["Product Name"].strip()
            data_file = Path(row["Data File"].strip())
            info = overview.get(name)
            if not info:
                continue
            category = categorize_product(name)
            margin = PROFIT_MARGINS.get(category, 0.15)
            prices = read_prices(data_file)
            price = suggest_price(name, prices, info["current_price"], info["unit_cost"], margin)
            results.append({
                "Product Name": name,
                "Product ID": row["Product ID"],
                "Recommended Price": f"{price:.2f}",
                "Category": category,
            })
    out_path = Path("recommended_prices.csv")
    with open(out_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["Product Name", "Product ID", "Recommended Price", "Category"])
        writer.writeheader()
        writer.writerows(results)
    print(f"Saved {len(results)} recommendations to {out_path}")


if __name__ == "__main__":
    main()
