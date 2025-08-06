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
  const [scrapedData, setScrapedData] = useState([])
  const [logs, setLogs] = useState([])

  const stores = [
    { name: 'EarthHero', url: 'earthhero.com', status: 'pending' },
    { name: 'Package Free Shop', url: 'packagefreeshop.com', status: 'pending' },
    { name: 'Ten Thousand Villages', url: 'tenthousandvillages.com', status: 'pending' },
    { name: 'Made Trade', url: 'madetrade.com', status: 'pending' },
    { name: 'Zero Waste Store', url: 'zerowastestoreonline.com', status: 'pending' }
  ]

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
    setLogs([])

    try {
      const response = await fetch('/api/scraper/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products }),
      })

      if (response.ok) {
        // Start polling for progress
        pollProgress()
      } else {
        throw new Error('Failed to start scraping')
      }
    } catch (error) {
      console.error('Error starting scraper:', error)
      setIsRunning(false)
      onStatusChange('error')
    }
  }

  const pollProgress = async () => {
    try {
      const response = await fetch('/api/scraper/progress')
      const data = await response.json()
      
      setProgress(data.progress)
      setCurrentStore(data.currentStore)
      setLogs(data.logs)
      
      if (data.completed) {
        setIsRunning(false)
        onStatusChange('completed')
        setScrapedData(data.results)
        onComplete()
      } else if (data.error) {
        setIsRunning(false)
        onStatusChange('error')
      } else {
        // Continue polling
        setTimeout(pollProgress, 2000)
      }
    } catch (error) {
      console.error('Error polling progress:', error)
      setIsRunning(false)
      onStatusChange('error')
    }
  }

  const stopScraping = async () => {
    try {
      await fetch('/api/scraper/stop', { method: 'POST' })
      setIsRunning(false)
      onStatusChange('stopped')
    } catch (error) {
      console.error('Error stopping scraper:', error)
    }
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
                Currently scraping: {currentStore}
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
              <span className="text-blue-600">Collecting competitor data...</span>
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
                {scrapedData.reduce((sum, item) => sum + item.productCount, 0)}
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