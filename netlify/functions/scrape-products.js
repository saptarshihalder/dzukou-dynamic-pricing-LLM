const fetch = require('node-fetch')
const cheerio = require('cheerio')

// Store configurations with actual selectors from each site
const STORE_CONFIGS = {
  'earthhero.com': {
    searchUrl: (keyword) => `https://earthhero.com/search?q=${encodeURIComponent(keyword)}`,
    selectors: {
      container: '.product-item, .product-card, [data-product-id]',
      name: '.product-item__title, .product-title, h3.title',
      price: '.product-item__price, .price, [data-price]',
      link: 'a[href*="/products/"]',
      image: '.product-item__image img, .product-image img'
    }
  },
  'packagefreeshop.com': {
    searchUrl: (keyword) => `https://packagefreeshop.com/search?q=${encodeURIComponent(keyword)}`,
    selectors: {
      container: '.grid-product, .product-item',
      name: '.grid-product__title, .product-title',
      price: '.grid-product__price, .product-price',
      link: 'a[href*="/products/"]',
      image: '.grid-product__image img'
    }
  },
  'grove.co': {
    searchUrl: (keyword) => `https://www.grove.co/catalog/search?q=${encodeURIComponent(keyword)}`,
    selectors: {
      container: '[data-test="product-tile"], .product-tile',
      name: '[data-test="product-name"], .product-name',
      price: '[data-test="product-price"], .product-price',
      link: 'a[href*="/catalog/product/"]',
      image: 'img[data-test="product-image"]'
    }
  },
  'tenthousandvillages.com': {
    searchUrl: (keyword) => `https://www.tenthousandvillages.com/search?q=${encodeURIComponent(keyword)}`,
    selectors: {
      container: '.product-tile, .product-item',
      name: '.product-name, .tile-body .link',
      price: '.product-pricing, .price .value',
      link: 'a.link, a[href*="/products/"]',
      image: '.tile-image img'
    }
  },
  'madetrade.com': {
    searchUrl: (keyword) => `https://www.madetrade.com/search?q=${encodeURIComponent(keyword)}`,
    selectors: {
      container: '.product-item, .collection-item',
      name: '.product-item-title, h3.title',
      price: '.product-item-price, .price',
      link: 'a[href*="/products/"]',
      image: '.product-item-image img'
    }
  }
}

// ScrapingFish API configuration (optional but recommended for better success rates)
const SCRAPINGFISH_API_KEY = process.env.SCRAPINGFISH_API_KEY || ''
const USE_SCRAPINGFISH = Boolean(SCRAPINGFISH_API_KEY)

/**
 * Extract clean price from text
 * @param {string} priceText - Raw price text from HTML
 * @returns {number|null} - Extracted price or null if invalid
 */
function extractPrice(priceText) {
  if (!priceText || typeof priceText !== 'string') return null
  
  // Remove currency symbols and extra text
  const cleaned = priceText.replace(/[^0-9.,]/g, '')
  
  // Find price patterns (e.g., "29.99", "1,234.56")
  const match = cleaned.match(/\d+([.,]\d{2})?/)
  
  if (match) {
    const price = parseFloat(match[0].replace(',', ''))
    // Only return valid positive prices
    return price > 0 && price < 100000 ? price : null
  }
  
  return null
}

/**
 * Fetch HTML content with ScrapingFish API
 * @param {string} url - URL to scrape
 * @returns {Promise<string|null>} - HTML content or null
 */
async function fetchWithScrapingFish(url) {
  try {
    const apiUrl = 'https://scraping.narf.ai/api/v1/'
    const params = new URLSearchParams({
      api_key: SCRAPINGFISH_API_KEY,
      url: url,
      render_js: 'true',
      wait_for_selector: 'body',
      timeout: '30000'
    })
    
    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET',
      timeout: 45000
    })
    
    if (response.ok) {
      return await response.text()
    }
    
    console.error('ScrapingFish API error:', response.status)
    return null
  } catch (error) {
    console.error('ScrapingFish fetch error:', error.message)
    return null
  }
}

/**
 * Fetch HTML content with standard fetch
 * @param {string} url - URL to scrape
 * @returns {Promise<string|null>} - HTML content or null
 */
async function fetchWithStandard(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache'
      },
      timeout: 30000
    })
    
    if (response.ok) {
      return await response.text()
    }
    
    console.error('Fetch error:', response.status)
    return null
  } catch (error) {
    console.error('Standard fetch error:', error.message)
    return null
  }
}

/**
 * Scrape products from a single store
 * @param {string} storeName - Store domain name
 * @param {string} keyword - Search keyword
 * @returns {Promise<Array>} - Array of product objects
 */
async function scrapeStore(storeName, keyword) {
  const config = STORE_CONFIGS[storeName]
  if (!config) {
    console.error(`No configuration for store: ${storeName}`)
    return []
  }
  
  const url = config.searchUrl(keyword)
  console.log(`Scraping ${storeName} for "${keyword}"`)
  
  // Try to fetch HTML content
  let html = null
  
  if (USE_SCRAPINGFISH) {
    html = await fetchWithScrapingFish(url)
  }
  
  if (!html) {
    html = await fetchWithStandard(url)
  }
  
  if (!html) {
    console.error(`Failed to fetch content from ${storeName}`)
    return []
  }
  
  // Parse HTML with Cheerio
  const $ = cheerio.load(html)
  const products = []
  
  // Find product containers
  const containers = $(config.selectors.container)
  console.log(`Found ${containers.length} product containers on ${storeName}`)
  
  containers.each((index, element) => {
    if (index >= 50) return // Limit to 50 products per search
    
    try {
      const container = $(element)
      
      // Extract product name
      const nameElement = container.find(config.selectors.name).first()
      const name = nameElement.text().trim()
      
      // Extract price
      const priceElement = container.find(config.selectors.price).first()
      const priceText = priceElement.text()
      const price = extractPrice(priceText)
      
      // Extract URL
      const linkElement = container.find(config.selectors.link).first()
      let productUrl = linkElement.attr('href')
      
      if (productUrl && !productUrl.startsWith('http')) {
        productUrl = `https://${storeName}${productUrl.startsWith('/') ? '' : '/'}${productUrl}`
      }
      
      // Extract image URL (optional)
      const imageElement = container.find(config.selectors.image).first()
      let imageUrl = imageElement.attr('src') || imageElement.attr('data-src')
      
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `https://${storeName}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
      }
      
      // Only add product if we have valid name and price
      if (name && name.length > 0 && price !== null) {
        products.push({
          name: name.substring(0, 200), // Limit name length
          price: price,
          currency: 'USD',
          store: storeName,
          url: productUrl || null,
          imageUrl: imageUrl || null,
          keyword: keyword,
          scrapedAt: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error(`Error parsing product from ${storeName}:`, error.message)
    }
  })
  
  console.log(`Successfully scraped ${products.length} valid products from ${storeName}`)
  return products
}

/**
 * Main Netlify Function handler
 */
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    }
  }
  
  try {
    // Parse request body
    const { stores, keywords, category } = JSON.parse(event.body)
    
    // Validate input
    if (!stores || !Array.isArray(stores) || stores.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid stores parameter' })
      }
    }
    
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid keywords parameter' })
      }
    }
    
    // Limit requests to prevent abuse
    const maxStores = 6
    const maxKeywords = 5
    const limitedStores = stores.slice(0, maxStores)
    const limitedKeywords = keywords.slice(0, maxKeywords)
    
    console.log(`Processing ${limitedStores.length} stores with ${limitedKeywords.length} keywords`)
    
    // Collect all products
    const allProducts = []
    const errors = []
    
    for (const store of limitedStores) {
      for (const keyword of limitedKeywords) {
        try {
          const products = await scrapeStore(store, keyword)
          allProducts.push(...products)
          
          // Add delay to be respectful to servers
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`Error scraping ${store} for "${keyword}":`, error.message)
          errors.push({
            store,
            keyword,
            error: error.message
          })
        }
      }
    }
    
    // Prepare response
    const response = {
      success: true,
      category: category || 'general',
      totalProducts: allProducts.length,
      products: allProducts,
      errors: errors.length > 0 ? errors : undefined,
      scrapedAt: new Date().toISOString()
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(response)
    }
    
  } catch (error) {
    console.error('Handler error:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message
      })
    }
  }
}

// Export individual functions for testing
module.exports = {
  handler: exports.handler,
  extractPrice,
  scrapeStore
}