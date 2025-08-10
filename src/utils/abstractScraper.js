/**
 * Abstract API scraper utility functions
 */

const ABSTRACT_API_KEY = '96f5aedb1c894ca6afafb0223600d065'
const ABSTRACT_API_URL = 'https://scrape.abstractapi.com/v1/'

// Store search URL patterns
export const STORE_SEARCH_PATTERNS = {
  'earthhero.com': 'https://earthhero.com/search?q={}',
  'packagefreeshop.com': 'https://packagefreeshop.com/search?q={}',
  'tenthousandvillages.com': 'https://www.tenthousandvillages.com/search?q={}',
  'madetrade.com': 'https://www.madetrade.com/search?q={}',
  'zerowastestoreonline.com': 'https://zerowastestoreonline.com/search?q={}'
}

/**
 * Helper function for async HTTP requests using XMLHttpRequest
 * @param {string} url - URL to fetch
* @param {Function} callback - Callback function to handle response
 */
export const httpGetAsync = (url, callback) => {
  const xmlHttp = new XMLHttpRequest()
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      callback(xmlHttp.responseText)
    }
  }
  xmlHttp.open("GET", url, true) // true for asynchronous
  xmlHttp.send(null)
}

/**
 * Extract price from text content
 * @param {string} text - Text containing price
 * @returns {number|null} - Extracted price or null
 */
export const extractPrice = (text) => {
  if (!text) return null
  
  // Look for price patterns like $29.99, €45.50, etc.
  const priceMatch = text.match(/[\$€£]?(\d+(?:\.\d{2})?)/g)
  if (priceMatch) {
    const prices = priceMatch.map(p => {
      const cleaned = p.replace(/[\$€£]/g, '')
      return parseFloat(cleaned)
    })
    
    // Return the first reasonable price found
    return prices.find(p => p > 0 && p < 10000) || null
  }
  return null
}

/**
 * Extract product name from element
 * @param {Element} element - DOM element
 * @returns {string|null} - Product name or null
 */
export const extractProductName = (element) => {
  // Try different selectors for product names
  const nameSelectors = [
    'h1', 'h2', 'h3', 'h4', 
    '.product-title', '.title', '.name',
    'a[href*="/products/"]',
    '.product-name'
  ]
  
  for (const selector of nameSelectors) {
    const nameEl = element.querySelector(selector)
    if (nameEl) {
      const text = nameEl.textContent?.trim()
      if (text && text.length > 3 && !text.includes('$') && !text.includes('€')) {
        return text.substring(0, 100)
      }
    }
  }
  
  // Fallback: use element text content
  const text = element.textContent?.trim()
  if (text && text.length > 3) {
    // Remove price information and clean up
    const cleaned = text.replace(/[\$€£]\d+(?:\.\d{2})?/g, '').trim()
    return cleaned.substring(0, 100)
  }
  
  return null
}

/**
 * Extract products from HTML content
 * @param {string} html - HTML content
 * @param {string} storeName - Store name
 * @param {string} keyword - Search keyword
 * @returns {Array} - Array of product objects
 */
export const extractProductsFromHTML = (html, storeName, keyword) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const products = []

  // Look for elements containing price information
  const allElements = doc.querySelectorAll('*')
  const priceElements = Array.from(allElements).filter(el => {
    const text = el.textContent || ''
    return /[\$€£]\d+/.test(text) && text.length < 300
  })

  // Process each price element
  priceElements.slice(0, 25).forEach((element, index) => {
    try {
      const price = extractPrice(element.textContent)
      if (price && price > 0) {
        let name = extractProductName(element)
        
        // If no name found in current element, check parent elements
        if (!name) {
          let current = element.parentElement
          for (let i = 0; i < 3 && current; i++) {
            name = extractProductName(current)
            if (name) break
            current = current.parentElement
          }
        }

        // Generate fallback name if still not found
        if (!name) {
          name = `${keyword} Product ${index + 1}`
        }

        products.push({
          category: keyword,
          store: storeName,
          product_name: name,
          price: price.toFixed(2),
          search_term: keyword,
          store_url: STORE_SEARCH_PATTERNS[storeName.toLowerCase().replace(/\s+/g, '')]?.replace('/search?q={}', '') || `https://${storeName.toLowerCase().replace(/\s+/g, '')}.com`
        })
      }
    } catch (error) {
      console.error('Error processing element:', error)
    }
  })

  return products
}

/**
 * Scrape products from a store using Abstract API
 * @param {string} storeName - Store name
 * @param {string} keyword - Search keyword
 * @returns {Promise<Array>} - Array of scraped products
 */
export const scrapeStoreWithAbstract = async (storeName, keyword) => {
  return new Promise((resolve, reject) => {
    const storeKey = storeName.toLowerCase().replace(/\s+/g, '')
    const searchPattern = STORE_SEARCH_PATTERNS[storeKey]
    
    if (!searchPattern) {
      reject(new Error(`No search pattern configured for ${storeName}`))
      return
    }

    const searchUrl = searchPattern.replace('{}', encodeURIComponent(keyword))
    const abstractUrl = `https://scrape.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}&url=${encodeURIComponent(searchUrl)}`
    
    console.log(`Scraping ${storeName} for "${keyword}"`)
    
    httpGetAsync(abstractUrl, (response) => {
      try {
        const data = JSON.parse(response)
        
        if (data.content) {
          const products = extractProductsFromHTML(data.content, storeName, keyword)
          console.log(`Found ${products.length} products from ${storeName}`)
          resolve(products)
        } else {
          console.log(`No content returned from ${storeName}`)
          resolve([])
        }
      } catch (error) {
        console.error(`Error parsing response from ${storeName}:`, error.message)
        resolve([])
      }
    })
  })
}

/**
 * Batch scrape multiple stores and keywords
 * @param {Array} stores - Array of store names
 * @param {Array} keywords - Array of search keywords
 * @param {Function} progressCallback - Progress update callback
 * @returns {Promise<Array>} - Array of all scraped products
 */
export const batchScrape = async (stores, keywords, progressCallback) => {
  const allProducts = []
  const total = stores.length * keywords.length
  let current = 0
  
  for (const store of stores) {
    for (const keyword of keywords) {
      current++
      
      if (progressCallback) {
        progressCallback({
          current,
          total,
          store,
          keyword,
          percentage: (current / total) * 100
        })
      }
      
      const products = await scrapeStoreWithAbstract(store, keyword)
      allProducts.push(...products)
      
      // Add delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }
  
  return allProducts
}