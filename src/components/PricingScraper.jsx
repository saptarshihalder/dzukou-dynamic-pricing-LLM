import React, { useState, useEffect } from 'react'
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Database, 
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Globe,
  Download,
  FileText
} from 'lucide-react'

const PricingScraper = ({ products, status, onStatusChange, onComplete, onNext }) => {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStore, setCurrentStore] = useState('')
  const [currentKeyword, setCurrentKeyword] = useState('')
  const [scrapedData, setScrapedData] = useState([])
  const [logs, setLogs] = useState([])

  // Abstract API configuration
  const ABSTRACT_API_KEY = '96f5aedb1c894ca6afafb0223600d065'
  const ABSTRACT_API_URL = 'https://scrape.abstractapi.com/v1/'

  // Store configurations
  const STORE_CONFIGS = {
    'EarthHero': 'https://earthhero.com/search?q={}',
    'Package Free Shop': 'https://packagefreeshop.com/search?q={}',
    'Ten Thousand Villages': 'https://www.tenthousandvillages.com/search?q={}',
    'Made Trade': 'https://www.madetrade.com/search?q={}',
    'Zero Waste Store': 'https://zerowastestoreonline.com/search?q={}'
  }

  const stores = [
    { name: 'EarthHero', url: 'earthhero.com', status: 'pending' },
    { name: 'Package Free Shop', url: 'packagefreeshop.com', status: 'pending' },
    { name: 'Ten Thousand Villages', url: 'tenthousandvillages.com', status: 'pending' },
    { name: 'Made Trade', url: 'madetrade.com', status: 'pending' },
    { name: 'Zero Waste Store', url: 'zerowastestoreonline.com', status: 'pending' }
  ]

  // Helper function for async HTTP requests using XMLHttpRequest
  const httpGetAsync = (url) => {
    return new Promise((resolve, reject) => {
      const xmlHttp = new XMLHttpRequest()
      xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4) {
          if (xmlHttp.status === 200) {
            resolve(xmlHttp.responseText)
          } else {
            reject(new Error(`HTTP ${xmlHttp.status}: ${xmlHttp.statusText}`))
          }
        }
      }
      xmlHttp.open("GET", url, true)
      xmlHttp.send(null)
    })
  }

  // Extract price from text
  const extractPrice = (text) => {
    if (!text) return null
    const priceMatch = text.match(/\$?(\d+(?:\.\d{2})?)/g)
    if (priceMatch) {
      const prices = priceMatch.map(p => parseFloat(p.replace('$', '')))
      return prices.find(p => p > 0 && p < 10000) || null
    }
    return null
  }

  // Extract products from HTML content
  const extractProductsFromHTML = (html, storeName, keyword) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const products = []

    // Look for elements containing price information
    const allElements = doc.querySelectorAll('*')
    const priceElements = Array.from(allElements).filter(el => {
      const text = el.textContent || ''
      return /\$\d+/.test(text) && text.length < 200
    })

    priceElements.slice(0, 20).forEach((element, index) => {
      try {
        const price = extractPrice(element.textContent)
        if (price) {
          // Try to find associated product name
          let name = ''
          let current = element
          
          // Look in parent elements for product name
          for (let i = 0; i < 3 && current.parentElement; i++) {
            current = current.parentElement
            const nameElements = current.querySelectorAll('h1, h2, h3, h4, a, .title, .name')
            
            for (const nameEl of nameElements) {
              const text = nameEl.textContent?.trim()
              if (text && text.length > 3 && !text.includes('$') && text.length < 100) {
                name = text
                break
              }
            }
            if (name) break
          }

          if (!name) {
            name = `${keyword} Product ${index + 1} from ${storeName}`
          }

          products.push({
            category: keyword,
            store: storeName,
            product_name: name,
            price: price.toFixed(2),
            search_term: keyword,
            store_url: STORE_CONFIGS[storeName]?.replace('/search?q={}', '') || `https://${storeName.toLowerCase().replace(/\s+/g, '')}.com`
          })
        }
      } catch (error) {
        console.error('Error processing element:', error)
      }
    })

    return products
  }

  // Add log entry
  const addLog = (message) => {
    const timestamp = new Date().toISOString().substr(11, 8)
    setLogs(prev => [...prev, { timestamp, message }])
  }

  // Scrape single store with Abstract API
  const scrapeStoreWithAbstract = async (storeName, keyword) => {
    try {
      const searchUrl = STORE_CONFIGS[storeName]?.replace('{}', encodeURIComponent(keyword))
      if (!searchUrl) {
        addLog(`No search URL configured for ${storeName}`)
        return []
      }

      addLog(`Scraping ${storeName} for "${keyword}"`)
      setCurrentStore(storeName)
      setCurrentKeyword(keyword)
      
      const abstractUrl = `${ABSTRACT_API_URL}?api_key=${ABSTRACT_API_KEY}&url=${encodeURIComponent(searchUrl)}`
      
      const response = await httpGetAsync(abstractUrl)
      const data = JSON.parse(response)
      
      if (data.content) {
        const products = extractProductsFromHTML(data.content, storeName, keyword)
        addLog(`Found ${products.length} products from ${storeName}`)
        return products
      } else {
        addLog(`No content returned from ${storeName}`)
        return []
      }
    } catch (error) {
      addLog(`Error scraping ${storeName}: ${error.message}`)
      return []
    }
  }

  const downloadScrapedData = () => {
    if (scrapedData.length === 0) {
      alert('No scraped data available to download')
      return
    }
    
    // Convert to CSV format
    const headers = ['Category', 'Store', 'Product Name', 'Price', 'Search Term', 'Store URL']
    const csvContent = [
      headers.join(','),
      ...scrapedData.map(item => [
        item.category,
        item.store,
        `"${item.product_name.replace(/"/g, '""')}"`,
        item.price,
        item.search_term,
        item.store_url
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `competitor-data-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }
  const startScraping = async () => {
    if (products.length === 0) {
      alert('Please add products first before scraping competitor data.')
      return
    }

    setIsRunning(true)
    onStatusChange('running')
    setProgress(0)
    setCurrentStore('')
    setCurrentKeyword('')
    setLogs([])
    setScrapedData([])
    
    addLog('Starting competitor data collection with Abstract API...')

    try {
      const allResults = []
      const storeNames = Object.keys(STORE_CONFIGS)
      const totalOperations = storeNames.length * products.length
      let completed = 0
      
      for (const storeName of storeNames) {
        for (const product of products) {
          const keyword = product.keywords?.split(',')[0]?.trim() || product.category.toLowerCase()
          
          const results = await scrapeStoreWithAbstract(storeName, keyword)
          allResults.push(...results)
          
          completed++
          setProgress((completed / totalOperations) * 100)
          
          // Add delay between requests to be respectful
          await new Promise(resolve => setTimeout(resolve, 3000))
        }
      }
      
      setScrapedData(allResults)
      setIsRunning(false)
      onStatusChange('completed')
      addLog(`Data collection completed! Found ${allResults.length} total products.`)
      onComplete()
      
    } catch (error) {
      console.error('Error starting scraper:', error)
      addLog(`Error: ${error.message}`)
      setIsRunning(false)
      onStatusChange('error')
    }
  }

  const stopScraping = async () => {
    setIsRunning(false)
    onStatusChange('stopped')
    addLog('Scraping stopped by user')
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Collect Competitor Data
        </h1>
        <p className="text-gray-600">
          Automatically scrape competitor prices from sustainable online stores to understand your market position.
        </p>
      </div>

      {/* Control Panel */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Data Collection Control</h2>
          <div className="flex gap-4">
            {!isRunning ? (
              <button 
                onClick={startScraping}
                className="btn-primary"
                disabled={products.length === 0}
              >
                <Play className="w-5 h-5" />
                Start Scraping
              </button>
            ) : (
              <button 
                onClick={stopScraping}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Pause className="w-5 h-5" />
                Stop Scraping
              </button>
            )}
            
            {status === 'completed' && (
              <button 
                onClick={onNext}
                className="btn-primary"
              >
                Next: Optimize Prices
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            
            {scrapedData.length > 0 && (
              <button 
                onClick={downloadScrapedData}
                className="btn-secondary"
              >
                <Download className="w-4 h-4" />
                Download Data
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress: {Math.round(progress)}%
              </span>
              <span className="text-sm text-gray-500">
                {currentStore} - "{currentKeyword}"
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center gap-3">
          {status === 'idle' && (
            <>
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">Ready to start data collection</span>
            </>
          )}
          {status === 'running' && (
            <>
              <RefreshCw className="w-5 h-5 text-blue-600 loading-spinner" />
              <span className="text-blue-600">
                Collecting competitor data using Abstract API...
              </span>
            </>
          )}
          {status === 'completed' && (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-600">Data collection completed successfully</span>
            </>
          )}
          {status === 'error' && (
            <>
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-600">Error occurred during data collection</span>
            </>
          )}
        </div>
      </div>

      {/* Stores Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stores.map((store, index) => (
          <div key={index} className="card">
            <div className="flex items-center gap-3 mb-3">
              <Globe className="w-6 h-6 text-gray-400" />
              <div>
                <h3 className="font-medium text-gray-900">{store.name}</h3>
                <p className="text-sm text-gray-500">{store.url}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentStore === store.name ? (
                <>
                  <RefreshCw className="w-4 h-4 text-blue-600 loading-spinner" />
                  <span className="text-sm text-blue-600">Scraping...</span>
                </>
              ) : status === 'completed' ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Completed</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Pending</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Results Summary */}
      {scrapedData.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-6">Collection Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {scrapedData.length}
              </div>
              <div className="text-sm text-gray-600">Total Products Found</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {stores.length}
              </div>
              <div className="text-sm text-gray-600">Stores Scraped</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {products.length}
              </div>
              <div className="text-sm text-gray-600">Your Products</div>
            </div>
          </div>
          
          {/* Sample of scraped products */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Sample Results</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Price</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Store</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {scrapedData.slice(0, 10).map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{item.product_name}</td>
                      <td className="py-3 px-4">€{item.price}</td>
                      <td className="py-3 px-4">{item.store}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {scrapedData.length > 10 && (
                <div className="text-center py-3 text-gray-500 text-sm">
                  Showing 10 of {scrapedData.length} products
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activity Logs */}
      {logs.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Activity Log</h2>
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-sm text-gray-700 mb-1 font-mono">
                <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      {products.length === 0 && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">No Products Added</h3>
              <p className="text-yellow-800 mb-4">
                You need to add products before you can collect competitor data. 
                Go back to the "Manage Products" tab to add your products first.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PricingScraper