import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
import re
from urllib.parse import quote
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import logging
import os
import sys
from datetime import datetime

# Configure logging with UTF-8 encoding
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('scraper.log', encoding='utf-8')
    ]
)

logger = logging.getLogger(__name__)


class ProductScraper:
    def __init__(self):
        self.session = requests.Session()

        # Rotate user agents
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
        ]

        self.session.headers.update({
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        })

        # Configure Chrome options for Selenium
        self.chrome_options = Options()
        self.chrome_options.add_argument('--headless')
        self.chrome_options.add_argument('--no-sandbox')
        self.chrome_options.add_argument('--disable-dev-shm-usage')
        self.chrome_options.add_argument('--disable-gpu')
        self.chrome_options.add_argument(f'--user-agent={random.choice(self.user_agents)}')

        # Store configurations for the target stores
        self.stores = {
            'Made Trade': {
                'url': 'https://www.madetrade.com',
                'search_pattern': '/search?q={}'
            },
            'EarthHero': {
                'url': 'https://earthhero.com',
                'search_pattern': '/search?q={}'
            },
            'Package Free Shop': {
                'url': 'https://packagefreeshop.com',
                'search_pattern': '/search?q={}'
            },
            'Ten Thousand Villages': {
                'url': 'https://www.tenthousandvillages.com',
                'search_pattern': '/search?q={}'
            },
            'Zero Waste Store': {
                'url': 'https://zerowastestoreonline.com',
                'search_pattern': '/search?q={}'
            }
        }

        # Product categories with search terms and output CSV file names
        self.product_categories = {
            'Wooden Sunglasses': {
                'search_terms': [
                    'wooden sunglasses',
                    'wood sunglasses',
                    'sustainable sunglasses',
                    'bamboo sunglasses',
                    'eco-friendly sunglasses',
                    'natural wood eyewear'
                ],
                'csv_filename': 'wooden_sunglasses.csv'
            },
            'Thermos Bottles': {
                'search_terms': [
                    'thermos bottle',
                    'stainless steel bottle',
                    'insulated bottle',
                    'vacuum insulated bottle',
                    'eco water bottle',
                    'sustainable water bottle'
                ],
                'csv_filename': 'thermos_bottles.csv'
            },
            'Coffee Mugs': {
                'search_terms': [
                    'coffee mug',
                    'ceramic mug',
                    'bamboo mug',
                    'eco-friendly mug',
                    'sustainable coffee cup',
                    'reusable coffee mug'
                ],
                'csv_filename': 'coffee_mugs.csv'
            },
            'Lunch Box 1200ML': {
                'search_terms': [
                    '1200ml lunch box',
                    'lunch box 1200ml',
                    'large lunch container',
                    'stainless steel lunch box large',
                    'eco lunch box large',
                    '1.2L food container'
                ],
                'csv_filename': 'lunch_box_1200ml.csv'
            },
            'Lunch Box 800ML': {
                'search_terms': [
                    '800ml lunch box',
                    'lunch box 800ml',
                    'medium lunch container',
                    'stainless steel lunch box medium',
                    'eco lunch box medium',
                    '800ml food container'
                ],
                'csv_filename': 'lunch_box_800ml.csv'
            },
            'Silk Colored Stole': {
                'search_terms': [
                    'silk colored stole',
                    'colored silk stole',
                    'silk stole',
                    'colorful silk stole',
                    'silk scarf colored',
                    'vibrant silk stole',
                    'multicolor silk wrap',
                    'printed silk stole',
                    'silk wrap colored',
                    'handmade silk stole',
                    'artisan silk scarf',
                    'fair trade silk stole'
                ],
                'csv_filename': 'silk_colored_stole.csv'
            },
            'White Silk Stole': {
                'search_terms': [
                    'white silk stole',
                    'white stole',
                    'silk white stole',
                    'pure white silk stole',
                    'white silk scarf',
                    'white silk wrap',
                    'ivory silk stole',
                    'cream silk stole',
                    'white silk shawl',
                    'natural white silk stole',
                    'organic white silk',
                    'handmade white silk'
                ],
                'csv_filename': 'white_silk_stole.csv'
            },
            'Phone Stand': {
                'search_terms': [
                    'phone stand',
                    'wooden phone stand',
                    'bamboo phone holder',
                    'eco-friendly phone stand',
                    'sustainable phone holder',
                    'natural wood phone dock',
                    'desk phone stand',
                    'mobile phone holder'
                ],
                'csv_filename': 'phone_stand.csv'
            },
            'Notebooks': {
                'search_terms': [
                    'eco notebook',
                    'sustainable notebook',
                    'recycled paper journal',
                    'bamboo notebook',
                    'eco-friendly journal',
                    'handmade paper notebook',
                    'hemp paper notebook',
                    'tree-free journal'
                ],
                'csv_filename': 'notebooks.csv'
            }
        }

        # Create a directory for CSV files if it doesn't exist
        self.csv_dir = 'product_data'
        os.makedirs(self.csv_dir, exist_ok=True)

        # Storage for results by category
        self.results_by_category = {category: [] for category in self.product_categories}

    def clean_price(self, price_text: str):
        """Extract the numeric price from raw text."""
        if not price_text:
            return None
        price_match = re.search(r'(\$|€|£|Rs\.?|USD)?\s*(\d+[\.,]\d+|\d+)', price_text)
        if price_match:
            price_str = price_match.group(2).replace(',', '.')
            try:
                return float(price_str)
            except ValueError:
                return None
        return None

    def clean_product_name(self, name: str):
        if not name:
            return None
        name = name.strip()
        if len(name) < 3:
            return None
        if not re.search(r'[a-zA-Z]', name):
            return None
        return name

    def extract_products_from_html(self, html_content: bytes, search_term: str):
        products = []
        soup = BeautifulSoup(html_content, 'html.parser')
        price_elements = soup.find_all(string=re.compile(r'\$\s*\d+'))
        for price_element in price_elements:
            try:
                parent = price_element.parent
                for _ in range(3):
                    if parent and parent.parent:
                        parent = parent.parent
                if not parent:
                    continue
                name_elements = parent.find_all(['h1', 'h2', 'h3', 'h4', 'a', 'span', 'div'])
                product_name = None
                for elem in name_elements:
                    text = elem.get_text(strip=True)
                    if len(text) > 3 and '$' not in text:
                        product_name = self.clean_product_name(text)
                        if product_name:
                            break
                if not product_name:
                    continue
                price = self.clean_price(price_element)
                if product_name and price and price > 0:
                    products.append({'name': product_name, 'price': price, 'search_term': search_term})
            except Exception:
                continue
        return products

    def scrape_with_requests(self, store_name: str, store_config: dict, search_term: str):
        products = []
        try:
            search_url = store_config['url'] + store_config['search_pattern'].format(quote(search_term))
            logger.info(f"Requesting: {search_url}")
            self.session.headers['User-Agent'] = random.choice(self.user_agents)
            response = self.session.get(search_url, timeout=10)
            if response.status_code == 200:
                products = self.extract_products_from_html(response.content, search_term)
                logger.info(f"Found {len(products)} products via requests")
            else:
                logger.warning(f"Request failed with status code: {response.status_code}")
        except Exception as exc:
            logger.error(f"Error with requests: {exc}")
        return products

    def scrape_with_selenium(self, store_name: str, store_config: dict, search_term: str):
        products = []
        driver = None
        try:
            driver = webdriver.Chrome(options=self.chrome_options)
            search_url = store_config['url'] + store_config['search_pattern'].format(quote(search_term))
            logger.info(f"Selenium visiting: {search_url}")
            driver.get(search_url)
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, 'body')))
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
            time.sleep(1)
            elements_with_prices = driver.find_elements(By.XPATH, "//*[contains(text(), '$')]")
            for element in elements_with_prices[:30]:
                try:
                    parent = element
                    for _ in range(3):
                        if parent:
                            parent = parent.find_element(By.XPATH, '..')
                    if not parent:
                        continue
                    name_elements = parent.find_elements(By.CSS_SELECTOR, 'h1, h2, h3, h4, a, .title, .name, span')
                    product_name = None
                    for name_elem in name_elements:
                        text = name_elem.text.strip()
                        if len(text) > 3 and '$' not in text:
                            product_name = self.clean_product_name(text)
                            if product_name:
                                break
                    if not product_name:
                        continue
                    price = self.clean_price(element.text)
                    if product_name and price and price > 0:
                        products.append({'name': product_name, 'price': price, 'search_term': search_term})
                except Exception:
                    continue
            logger.info(f"Found {len(products)} products via Selenium")
        except Exception as exc:
            logger.error(f"Error with Selenium: {exc}")
        finally:
            if driver:
                driver.quit()
        return products

    def scrape_store(self, store_name: str, store_config: dict, category: str, search_terms):
        all_products = []
        for search_term in search_terms:
            logger.info(f"Searching for '{search_term}' in {store_name}")
            products = self.scrape_with_requests(store_name, store_config, search_term)
            if not products:
                products = self.scrape_with_selenium(store_name, store_config, search_term)
            if products:
                logger.info(f"Found {len(products)} products for '{search_term}'")
                all_products.extend(products)
            else:
                logger.info(f"No products found for '{search_term}'")
            time.sleep(random.uniform(1, 2))
        unique = []
        seen = set()
        for product in all_products:
            key = (product['name'].lower()[:20], round(product['price'], 0))
            if key not in seen:
                seen.add(key)
                unique.append(product)
        return unique

    def scrape_all_stores(self):
        logger.info("Starting product scraping...")
        total_products = 0
        for category, category_info in self.product_categories.items():
            logger.info(f"Category: {category}")
            search_terms = category_info['search_terms']
            for store_name, store_config in self.stores.items():
                logger.info(f"Checking {store_name}...")
                try:
                    logger.info(f"Searching for '{search_terms[0]}' in {store_name}")
                    products = self.scrape_store(store_name, store_config, category, search_terms)
                    if products:
                        for product in products:
                            self.results_by_category[category].append({
                                'category': category,
                                'store': store_name,
                                'product_name': product['name'],
                                'price': product['price'],
                                'search_term': product['search_term'],
                                'store_url': store_config['url']
                            })
                        logger.info(f"Added {len(products)} products from {store_name}")
                        total_products += len(products)
                    else:
                        logger.info(f"No products found from {store_name}")
                    time.sleep(random.uniform(1.5, 3.0))
                except requests.exceptions.RequestException as exc:
                    logger.error(f"Network error with {store_name}: {exc}")
                    continue
                except Exception as exc:
                    logger.error(f"Error scraping {store_name} for {category}: {exc}")
                    continue
        logger.info(f"Completed scraping all stores. Found {total_products} total products.")

    def save_category_csvs(self):
        total_products = 0
        saved_files = []
        for category, products in self.results_by_category.items():
            csv_filename = os.path.join(self.csv_dir, self.product_categories[category]['csv_filename'])
            if not products:
                logger.warning(f"No results for {category}")
                pd.DataFrame(columns=['category', 'store', 'product_name', 'price', 'search_term', 'store_url']).to_csv(csv_filename, index=False)
                print(f"Created empty file: {csv_filename}")
                saved_files.append(csv_filename)
                continue
            df = pd.DataFrame(products)
            df.to_csv(csv_filename, index=False)
            total_products += len(df)
            saved_files.append(csv_filename)
            logger.info(f"Saved {len(df)} products to {csv_filename}")
        print("\n" + "="*60)
        print("\U0001F4CA CATEGORY-SPECIFIC CSV FILES GENERATED")
        print("="*60)
        print(f"Total products found: {total_products}")
        print("\nCategory files created:")
        for filepath in saved_files:
            filename = os.path.basename(filepath)
            category = os.path.splitext(filename)[0].replace('_', ' ').title()
            product_count = len(pd.read_csv(filepath)) if os.path.exists(filepath) else 0
            print(f"  • {category}: {product_count} products - {filename}")
        print(f"\nAll files saved to: {self.csv_dir}/ directory")


def main():
    try:
        scraper = ProductScraper()
        print("Starting Category-Specific Product Scraper")
        print(f"Searching {len(scraper.product_categories)} product categories across {len(scraper.stores)} stores")
        print("Creating separate CSV files for each product type:")
        for category, info in scraper.product_categories.items():
            print(f"  • {category}: {info['csv_filename']}")
        print()
        scraper.scrape_all_stores()
        scraper.save_category_csvs()
    except Exception as exc:
        logger.error(f"Error in main execution: {exc}")
    logger.info("Scraping completed")


if __name__ == "__main__":
    main()
