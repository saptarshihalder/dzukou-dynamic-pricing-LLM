#!/usr/bin/env python3
"""Utility for adding products and keywords used by the pricing pipeline."""
import argparse
import csv
import json
import re
from pathlib import Path

MAPPING_CSV = "product_data_mapping.csv"
KEYWORDS_JSON = "category_keywords.json"
DATA_DIR = Path("product_data")


def sanitize_filename(name: str) -> str:
    base = re.sub(r"\W+", "_", name.lower()).strip("_")
    return base + ".csv"


def load_keywords() -> dict:
    if Path(KEYWORDS_JSON).exists():
        with open(KEYWORDS_JSON, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_keywords(data: dict) -> None:
    with open(KEYWORDS_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def add_product(name: str, prod_id: str, category: str, keywords: list[str]):
    # ensure data directory
    DATA_DIR.mkdir(exist_ok=True)
    mapping = []
    if Path(MAPPING_CSV).exists():
        with open(MAPPING_CSV, newline="") as f:
            mapping = list(csv.DictReader(f))

    file_name = sanitize_filename(name)
    data_file = DATA_DIR / file_name
    if not data_file.exists():
        data_file.write_text("category,store,product_name,price,search_term,store_url\n")

    mapping.append({"Product Name": name, "Product ID": prod_id, "Data File": str(data_file)})
    with open(MAPPING_CSV, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["Product Name", "Product ID", "Data File"])
        writer.writeheader()
        writer.writerows(mapping)

    kw_data = load_keywords()
    kws = kw_data.setdefault(category, [])
    for kw in keywords:
        if kw and kw not in kws:
            kws.append(kw)
    save_keywords(kw_data)
    print(f"Added product '{name}' with data file {data_file}")


def main():
    p = argparse.ArgumentParser(description="Manage product data and keywords")
    p.add_argument("name", help="Product name")
    p.add_argument("product_id", help="Product ID")
    p.add_argument("category", help="Product category")
    p.add_argument("--keywords", help="Comma separated keywords for the category", default="")
    args = p.parse_args()
    keywords = [k.strip() for k in args.keywords.split(",") if k.strip()]
    add_product(args.name, args.product_id, args.category, keywords)


if __name__ == "__main__":
    main()
