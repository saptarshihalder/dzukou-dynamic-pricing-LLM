import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Target,
  RefreshCw,
  FileText,
  Share2
} from 'lucide-react'

const Dashboard = ({ products }) => {
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedView, setSelectedView] = useState('overview')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/dashboard/data')
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadReport = async (format) => {
    try {
      const response = await fetch(`/api/dashboard/export?format=${format}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `pricing-report.${format}`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading report:', error)
    }
  }

  const generateDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard/generate', { method: 'POST' })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        window.open(url, '_blank')
      }
    } catch (error) {
      console.error('Error generating dashboard:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-primary-600 loading-spinner mr-3" />
          <span className="text-lg text-gray-600">Loading dashboard data...</span>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-500 mb-6">
            Complete the previous steps to generate your pricing dashboard
          </p>
          <button 
            onClick={fetchDashboardData}
            className="btn-primary"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Pricing Dashboard
            </h1>
            <p className="text-gray-600">
              Comprehensive analysis of your pricing optimization results
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => downloadReport('csv')}
              className="btn-secondary"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button 
              onClick={() => downloadReport('pdf')}
              className="btn-secondary"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </button>
            <button 
              onClick={generateDashboard}
              className="btn-primary"
            >
              <BarChart3 className="w-4 h-4" />
              Interactive Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                €{dashboardData.totalProfitIncrease?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-600">Total Profit Increase</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData.avgPriceChange?.toFixed(1) || '0.0'}%
              </div>
              <div className="text-sm text-gray-600">Avg Price Change</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData.productsOptimized || 0}
              </div>
              <div className="text-sm text-gray-600">Products Optimized</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData.significantChanges || 0}
              </div>
              <div className="text-sm text-gray-600">Significant Changes</div>
            </div>
          </div>
        </div>
      </div>

      {/* View Selector */}
      <div className="card mb-8">
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setSelectedView('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'overview' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Overview
          </button>
          <button 
            onClick={() => setSelectedView('products')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'products' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Product Details
          </button>
          <button 
            onClick={() => setSelectedView('categories')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'categories' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Category Analysis
          </button>
        </div>

        {/* Overview */}
        {selectedView === 'overview' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Pricing Recommendations Overview</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Price Changes Distribution</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price Increases</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(dashboardData.priceIncreases / products.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{dashboardData.priceIncreases || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price Decreases</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${(dashboardData.priceDecreases / products.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{dashboardData.priceDecreases || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">No Change</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gray-500 h-2 rounded-full"
                          style={{ width: `${(dashboardData.noChange / products.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{dashboardData.noChange || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Profit Impact Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current Total Profit</span>
                    <span className="font-medium">€{dashboardData.currentProfit?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Projected Total Profit</span>
                    <span className="font-medium text-green-600">€{dashboardData.projectedProfit?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium text-gray-900">Net Improvement</span>
                    <span className="font-bold text-green-600">
                      +€{dashboardData.totalProfitIncrease?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Details */}
        {selectedView === 'products' && dashboardData.recommendations && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Product-by-Product Analysis</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Current</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Recommended</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Change</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Profit Impact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recommendations.map((rec, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{rec.productName}</div>
                          <div className="text-sm text-gray-500">{rec.category}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium">€{rec.currentPrice}</td>
                      <td className="py-4 px-4 font-medium text-primary-600">€{rec.recommendedPrice}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {rec.priceChange > 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : rec.priceChange < 0 ? (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          ) : null}
                          <span className={`font-medium ${
                            rec.priceChange > 0 ? 'text-green-600' : 
                            rec.priceChange < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {rec.priceChange > 0 ? '+' : ''}{rec.priceChange}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-medium ${rec.profitImpact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {rec.profitImpact > 0 ? '+' : ''}€{rec.profitImpact}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rec.confidence === 'High' ? 'bg-green-100 text-green-800' :
                          rec.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {rec.confidence || 'Medium'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Category Analysis */}
        {selectedView === 'categories' && dashboardData.categoryAnalysis && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Category Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(dashboardData.categoryAnalysis).map(([category, data]) => (
                <div key={category} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{category}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Products</span>
                      <span className="font-medium">{data.productCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avg Price Change</span>
                      <span className={`font-medium ${data.avgPriceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.avgPriceChange > 0 ? '+' : ''}{data.avgPriceChange}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Profit Impact</span>
                      <span className={`font-medium ${data.profitImpact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.profitImpact > 0 ? '+' : ''}€{data.profitImpact}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Items */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Next Steps</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Immediate Actions</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                Review high-impact price changes for quick wins
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                Implement changes for products with high confidence scores
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                Monitor competitor responses to price changes
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Long-term Strategy</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                Schedule regular price optimization reviews
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                Expand competitor monitoring to new stores
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                Analyze seasonal pricing patterns
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard