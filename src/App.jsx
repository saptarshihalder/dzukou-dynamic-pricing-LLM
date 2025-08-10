import React, { useState, useEffect } from 'react'
import { 
  ShoppingCart, 
  TrendingUp, 
  Database, 
  BarChart3, 
  Settings,
  Upload,
  Download,
  Play,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import ProductManager from './components/ProductManager'
import PricingScraper from './components/PricingScraper'
import PriceOptimizer from './components/PriceOptimizer'
import Dashboard from './components/Dashboard'
import Tutorial from './components/Tutorial'
import ScrapingInterface from './components/ScrapingInterface'
import ProfitAnalyzer from './components/ProfitAnalyzer'
import LoadingSpinner from './components/LoadingSpinner'
import Toast from './components/Toast'

function App() {
  const [activeTab, setActiveTab] = useState('tutorial')
  const [products, setProducts] = useState([])
  const [scrapingStatus, setScrapingStatus] = useState('idle')
  const [optimizationStatus, setOptimizationStatus] = useState('idle')
  const [toast, setToast] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  const tabs = [
    { id: 'tutorial', label: 'Getting Started', icon: Info },
    { id: 'products', label: 'Manage Products', icon: ShoppingCart },
    { id: 'analysis', label: 'Profit Analysis', icon: TrendingUp },
    { id: 'scraper', label: 'Collect Data', icon: Database },
    { id: 'advanced-scraper', label: 'Advanced Scraper', icon: Database },
    { id: 'optimizer', label: 'Optimize Prices', icon: TrendingUp },
    { id: 'dashboard', label: 'View Results', icon: BarChart3 }
  ]

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleProductAdded = () => {
    fetchProducts()
    showToast('Product added successfully!', 'success')
  }

  const handleScrapingComplete = () => {
    setScrapingStatus('completed')
    showToast('Data collection completed successfully!', 'success')
  }

  const handleOptimizationComplete = () => {
    setOptimizationStatus('completed')
    showToast('Price optimization completed successfully!', 'success')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Dzukou Pricing Toolkit
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Smart pricing for sustainable products
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && <LoadingSpinner />}
        
        {activeTab === 'tutorial' && (
          <Tutorial onGetStarted={() => setActiveTab('products')} />
        )}
        
        {activeTab === 'products' && (
          <ProductManager 
            products={products}
            onProductAdded={handleProductAdded}
            onNext={() => setActiveTab('scraper')}
          />
        )}
        
        {activeTab === 'analysis' && (
          <ProfitAnalyzer />
        )}
        
        {activeTab === 'scraper' && (
          <PricingScraper 
            products={products}
            status={scrapingStatus}
            onStatusChange={setScrapingStatus}
            onComplete={handleScrapingComplete}
            onNext={() => setActiveTab('optimizer')}
          />
        )}
        
        {activeTab === 'advanced-scraper' && (
          <ScrapingInterface />
        )}
        
        {activeTab === 'optimizer' && (
          <PriceOptimizer 
            products={products}
            status={optimizationStatus}
            onStatusChange={setOptimizationStatus}
            onComplete={handleOptimizationComplete}
            onNext={() => setActiveTab('dashboard')}
          />
        )}
        
        {activeTab === 'dashboard' && (
          <Dashboard products={products} />
        )}
      </main>

      {/* Toast Notifications */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  )
}

export default App