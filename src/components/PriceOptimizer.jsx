import React, { useState } from 'react'
import { 
  TrendingUp, 
  Play, 
  Settings, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Target,
  BarChart3
} from 'lucide-react'

const PriceOptimizer = ({ products, status, onStatusChange, onComplete, onNext }) => {
  const [isRunning, setIsRunning] = useState(false)
  const [optimizationSettings, setOptimizationSettings] = useState({
    maxIncrease: 30,
    maxDecrease: 25,
    targetMargin: 20,
    competitiveWeight: 0.7,
    profitWeight: 0.3
  })
  const [results, setResults] = useState(null)

  const startOptimization = async () => {
    if (products.length === 0) {
      alert('Please add products and collect competitor data first.')
      return
    }

    setIsRunning(true)
    onStatusChange('running')

    try {
      const response = await fetch('/api/optimizer/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          products,
          settings: optimizationSettings 
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data)
        setIsRunning(false)
        onStatusChange('completed')
        onComplete()
      } else {
        throw new Error('Failed to start optimization')
      }
    } catch (error) {
      console.error('Error starting optimization:', error)
      setIsRunning(false)
      onStatusChange('error')
    }
  }

  const handleSettingChange = (setting, value) => {
    setOptimizationSettings(prev => ({
      ...prev,
      [setting]: value
    }))
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Optimize Your Prices
        </h1>
        <p className="text-gray-600">
          Use advanced algorithms to find the optimal price points that maximize your profit while staying competitive.
        </p>
      </div>

      {/* Optimization Settings */}
      <div className="card mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold">Optimization Settings</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Price Increase (%)
            </label>
            <input
              type="range"
              min="0"
              max="50"
              value={optimizationSettings.maxIncrease}
              onChange={(e) => handleSettingChange('maxIncrease', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span className="font-medium">{optimizationSettings.maxIncrease}%</span>
              <span>50%</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Price Decrease (%)
            </label>
            <input
              type="range"
              min="0"
              max="50"
              value={optimizationSettings.maxDecrease}
              onChange={(e) => handleSettingChange('maxDecrease', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span className="font-medium">{optimizationSettings.maxDecrease}%</span>
              <span>50%</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Margin (%)
            </label>
            <input
              type="range"
              min="5"
              max="50"
              value={optimizationSettings.targetMargin}
              onChange={(e) => handleSettingChange('targetMargin', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5%</span>
              <span className="font-medium">{optimizationSettings.targetMargin}%</span>
              <span>50%</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium mb-4">Optimization Strategy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Competitive Weight: {(optimizationSettings.competitiveWeight * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={optimizationSettings.competitiveWeight}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  handleSettingChange('competitiveWeight', value)
                  handleSettingChange('profitWeight', 1 - value)
                }}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                How much to prioritize staying competitive vs maximizing profit
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profit Weight: {(optimizationSettings.profitWeight * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={optimizationSettings.profitWeight}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  handleSettingChange('profitWeight', value)
                  handleSettingChange('competitiveWeight', 1 - value)
                }}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                How much to prioritize profit maximization vs competitiveness
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="card mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-primary-600" />
            <div>
              <h2 className="text-xl font-semibold">Price Optimization</h2>
              <p className="text-gray-600">Run the optimization algorithm to get pricing recommendations</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={startOptimization}
              disabled={isRunning || products.length === 0}
              className="btn-primary disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Optimizing...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start Optimization
                </>
              )}
            </button>
            
            {status === 'completed' && (
              <button 
                onClick={onNext}
                className="btn-primary"
              >
                View Results
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Preview */}
      {results && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-6">Optimization Results</h2>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                €{results.totalProfitIncrease?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-600">Total Profit Increase</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {results.avgPriceChange?.toFixed(1) || '0.0'}%
              </div>
              <div className="text-sm text-gray-600">Avg Price Change</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {results.productsOptimized || 0}
              </div>
              <div className="text-sm text-gray-600">Products Optimized</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {results.significantChanges || 0}
              </div>
              <div className="text-sm text-gray-600">Significant Changes</div>
            </div>
          </div>
          
          {/* Top Recommendations */}
          {results.recommendations && results.recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Top Recommendations</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Current Price</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Recommended</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Change</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Profit Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.recommendations.slice(0, 5).map((rec, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{rec.productName}</div>
                          <div className="text-sm text-gray-500">{rec.category}</div>
                        </td>
                        <td className="py-4 px-4 font-medium">€{rec.currentPrice}</td>
                        <td className="py-4 px-4 font-medium text-primary-600">€{rec.recommendedPrice}</td>
                        <td className="py-4 px-4">
                          <span className={`font-medium ${rec.priceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {rec.priceChange > 0 ? '+' : ''}{rec.priceChange}%
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`font-medium ${rec.profitImpact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            €{rec.profitImpact}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Messages */}
      {status === 'completed' && (
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-900 mb-2">Optimization Complete!</h3>
              <p className="text-green-800">
                Your pricing recommendations are ready. Review the results and proceed to the dashboard 
                to see detailed analysis and export your data.
              </p>
            </div>
          </div>
        </div>
      )}

      {products.length === 0 && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">No Data Available</h3>
              <p className="text-yellow-800">
                You need to add products and collect competitor data before running the optimization. 
                Please complete the previous steps first.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PriceOptimizer