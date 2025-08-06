import React, { useState } from 'react'
import { 
  Play, 
  Download, 
  Globe, 
  Search,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

const ScrapingInterface = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [config, setConfig] = useState({
    category: 'Eco Products',
    keywords: 'bamboo toothbrush\neco friendly soap\nreusable water bottle',
    stores: ['earthhero.com', 'packagefreeshop.com', 'tenthousandvillages.com']
  })

  const availableStores = [
    { id: 'earthhero.com', name: 'EarthHero', url: 'earthhero.com' },
    { id: 'packagefreeshop.com', name: 'Package Free Shop', url: 'packagefreeshop.com' },
    { id: 'grove.co', name: 'Grove Collaborative', url: 'grove.co' },
    { id: 'tenthousandvillages.com', name: 'Ten Thousand Villages', url: 'tenthousandvillages.com' },
    { id: 'madetrade.com', name: 'Made Trade', url: 'madetrade.com' }
  ]

  const startScraping = async () => {
    if (!config.category.trim()) {
      setError('Please enter a category name')
      return
    }

    const keywords = config.keywords.split('\n').map(k => k.trim()).filter(k => k)
    if (keywords.length === 0) {
      setError('Please enter at least one keyword')
      return
    }

    if (config.stores.length === 0) {
      setError('Please select at least one store')
      return
    }

    setIsRunning(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('/.netlify/functions/scrape-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: config.category,
          keywords: keywords,
          stores: config.stores
        })
      })

      const data = await response.json()

      if (data.success) {
        setResults(data)
      } else {
        setError(data.error || 'Scraping failed')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsRunning(false)
    }
  }

  const downloadCSV = () => {
    if (!results || !results.products) return

    const headers = ['Product Name', 'Price', 'Store', 'Keyword', 'URL', 'Scraped At']
    const csvContent = [
      headers.join(','),
      ...results.products.map(item => [
        `"${item.name.replace(/"/g, '""')}"`,
        item.price,
        item.store,
        item.keyword,
        item.url || '',
        item.scrapedAt
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

  const downloadJSON = () => {
    if (!results || !results.products) return

    const json = JSON.stringify(results.products, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `competitor-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleStoreToggle = (storeId) => {
    setConfig(prev => ({
      ...prev,
      stores: prev.stores.includes(storeId)
        ? prev.stores.filter(s => s !== storeId)
        : [...prev.stores, storeId]
    }))
  }

  const calculateStats = (products) => {
    if (!products || products.length === 0) {
      return { uniqueStores: 0, avgPrice: 0, minPrice: 0, maxPrice: 0 }
    }

    const prices = products.map(p => p.price)
    const stores = new Set(products.map(p => p.store))

    return {
      uniqueStores: stores.size,
      avgPrice: (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2),
      minPrice: Math.min(...prices).toFixed(2),
      maxPrice: Math.max(...prices).toFixed(2)
    }
  }

  const stats = results ? calculateStats(results.products) : null

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Advanced Product Scraper
        </h1>
        <p className="text-gray-600">
          Scrape competitor products from multiple eco-friendly stores using our serverless scraping infrastructure.
        </p>
      </div>

      {/* Configuration */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-6">Scraping Configuration</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name
            </label>
            <input
              type="text"
              value={config.category}
              onChange={(e) => setConfig(prev => ({ ...prev, category: e.target.value }))}
              className="input-field"
              placeholder="e.g., Sustainable Cleaning"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Keywords (one per line)
            </label>
            <textarea
              value={config.keywords}
              onChange={(e) => setConfig(prev => ({ ...prev, keywords: e.target.value }))}
              className="input-field"
              rows={4}
              placeholder="Enter keywords, one per line..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Stores to Scrape
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableStores.map(store => (
                <label key={store.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={config.stores.includes(store.id)}
                    onChange={() => handleStoreToggle(store.id)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <Globe className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{store.name}</div>
                    <div className="text-xs text-gray-500">{store.url}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button 
            onClick={startScraping}
            disabled={isRunning}
            className="btn-primary disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-5 h-5 loading-spinner" />
                Scraping...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Scraping
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isRunning && (
        <div className="card mb-8 text-center">
          <RefreshCw className="w-8 h-8 text-primary-600 loading-spinner mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Scraping in Progress</h3>
          <p className="text-gray-600">
            Collecting product data from {config.stores.length} stores...
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="card bg-red-50 border-red-200 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 mb-2">Scraping Error</h3>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-8">
          {/* Success Message */}
          <div className="card bg-green-50 border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900 mb-2">Scraping Complete!</h3>
                <p className="text-green-800">
                  Successfully scraped {results.totalProducts} products from {stats.uniqueStores} stores.
                </p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {results.totalProducts}
              </div>
              <div className="text-sm text-gray-600">Total Products</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {stats.uniqueStores}
              </div>
              <div className="text-sm text-gray-600">Stores Scraped</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                ${stats.avgPrice}
              </div>
              <div className="text-sm text-gray-600">Average Price</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                ${stats.minPrice} - ${stats.maxPrice}
              </div>
              <div className="text-sm text-gray-600">Price Range</div>
            </div>
          </div>

          {/* Download Options */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Export Data</h3>
            <div className="flex gap-4">
              <button 
                onClick={downloadCSV}
                className="btn-primary"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
              <button 
                onClick={downloadJSON}
                className="btn-secondary"
              >
                <Download className="w-4 h-4" />
                Download JSON
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Scraped Products</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Product Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Price</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Store</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Keyword</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {results.products.slice(0, 50).map((product, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{product.name}</div>
                      </td>
                      <td className="py-4 px-4 font-medium">${product.price}</td>
                      <td className="py-4 px-4">{product.store}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">{product.keyword}</td>
                      <td className="py-4 px-4">
                        {product.url ? (
                          <a 
                            href={product.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-800"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {results.products.length > 50 && (
                <div className="text-center py-4 text-gray-500">
                  Showing first 50 of {results.products.length} products
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScrapingInterface