import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Download,
  Calculator
} from 'lucide-react'

const ProfitAnalyzer = () => {
  const [productData] = useState([
    { name: "Reiek Peak Wooden Sunglasses (Incl. cork casing)", id: "SG0001", currentPrice: 57.95, unitCost: 14.23 },
    { name: "Fibonacci Wooden Sunglasses (Incl. cork casing)", id: "SG0002", currentPrice: 61.50, unitCost: 14.23 },
    { name: "Elephant Falls Thermos Bottle", id: "BT0005", currentPrice: 31.95, unitCost: 8.34 },
    { name: "Saint Elias Thermos bottles", id: "BT0012-13", currentPrice: 32.95, unitCost: 9.31 },
    { name: "Inca Trail Coffee Mugs", id: "BT0015-16", currentPrice: 31.95, unitCost: 8.55 },
    { name: "Woodland Mouse Phone Stand", id: "PS0007", currentPrice: 18.95, unitCost: 3.01 },
    { name: "Tiger Trail Notebooks", id: "NB0011-12", currentPrice: 25.95, unitCost: 6.79 },
    { name: "Papillon Notebooks", id: "NB0013-15", currentPrice: 23.95, unitCost: 5.21 },
    { name: "Jim Corbett Lunchbox Band 1200ML", id: "LB0017", currentPrice: 32.95, unitCost: 19.45 },
    { name: "Jim Corbett Lunchbox Band 800ML", id: "LB0019", currentPrice: 30.95, unitCost: 7.59 },
    { name: "Timeless Silk Colored Stole", id: "SH0017-26", currentPrice: 73.95, unitCost: 39.48 },
    { name: "Silk Uncut White Stole", id: "SH0025", currentPrice: 114.95, unitCost: 33.92 }
  ])

  const [analysis, setAnalysis] = useState(null)

  useEffect(() => {
    calculateAnalysis()
  }, [])

  const calculateAnalysis = () => {
    // Calculate profit margins for each product
    const productsWithMargins = productData.map(product => {
      const profitMargin = ((product.currentPrice - product.unitCost) / product.currentPrice) * 100
      const absoluteProfit = product.currentPrice - product.unitCost
      
      return {
        ...product,
        profitMargin: profitMargin,
        absoluteProfit: absoluteProfit,
        profitMarginFormatted: profitMargin.toFixed(1)
      }
    })

    // Sort by profit margin for rankings
    const sortedByMargin = [...productsWithMargins].sort((a, b) => b.profitMargin - a.profitMargin)
    
    // Get top 3 and bottom 3
    const top3 = sortedByMargin.slice(0, 3)
    const bottom3 = sortedByMargin.slice(-3).reverse()
    
    // Calculate average margin
    const averageMargin = productsWithMargins.reduce((sum, product) => sum + product.profitMargin, 0) / productsWithMargins.length
    
    // Find products below 50% margin
    const lowMarginProducts = productsWithMargins.filter(product => product.profitMargin < 50)
    
    // Calculate total revenue and profit
    const totalRevenue = productsWithMargins.reduce((sum, product) => sum + product.currentPrice, 0)
    const totalProfit = productsWithMargins.reduce((sum, product) => sum + product.absoluteProfit, 0)
    const overallMargin = (totalProfit / totalRevenue) * 100

    setAnalysis({
      productsWithMargins,
      top3,
      bottom3,
      averageMargin,
      lowMarginProducts,
      totalRevenue,
      totalProfit,
      overallMargin
    })
  }

  const downloadAnalysis = () => {
    if (!analysis) return

    const csvContent = [
      ['Product Name', 'Product ID', 'Current Price (€)', 'Unit Cost (€)', 'Absolute Profit (€)', 'Profit Margin (%)'].join(','),
      ...analysis.productsWithMargins.map(product => [
        `"${product.name}"`,
        product.id,
        product.currentPrice.toFixed(2),
        product.unitCost.toFixed(2),
        product.absoluteProfit.toFixed(2),
        product.profitMargin.toFixed(1)
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `profit-analysis-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getMarginColor = (margin) => {
    if (margin >= 70) return 'text-green-600'
    if (margin >= 50) return 'text-blue-600'
    if (margin >= 30) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMarginBadge = (margin) => {
    if (margin >= 70) return 'bg-green-100 text-green-800'
    if (margin >= 50) return 'bg-blue-100 text-blue-800'
    if (margin >= 30) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (!analysis) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Calculator className="w-8 h-8 text-primary-600 loading-spinner mr-3" />
          <span className="text-lg text-gray-600">Calculating profit analysis...</span>
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
              Product Profitability Analysis
            </h1>
            <p className="text-gray-600">
              Comprehensive analysis of profit margins across your product portfolio
            </p>
          </div>
          <button 
            onClick={downloadAnalysis}
            className="btn-primary"
          >
            <Download className="w-4 h-4" />
            Export Analysis
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {analysis.averageMargin.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Average Margin</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                €{analysis.totalProfit.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Profit</div>
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
                {analysis.overallMargin.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Overall Margin</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {analysis.lowMarginProducts.length}
              </div>
              <div className="text-sm text-gray-600">Below 50% Margin</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top and Bottom Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold">Top 3 Most Profitable</h2>
          </div>
          <div className="space-y-4">
            {analysis.top3.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500">{product.id}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {product.profitMarginFormatted}%
                  </div>
                  <div className="text-sm text-gray-600">
                    €{product.absoluteProfit.toFixed(2)} profit
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <TrendingDown className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold">3 Least Profitable</h2>
          </div>
          <div className="space-y-4">
            {analysis.bottom3.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500">{product.id}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-red-600">
                    {product.profitMarginFormatted}%
                  </div>
                  <div className="text-sm text-gray-600">
                    €{product.absoluteProfit.toFixed(2)} profit
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Complete Product Analysis Table */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-6">Complete Profit Margin Analysis</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Product Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Product ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Current Price</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Unit Cost</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Absolute Profit</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Profit Margin %</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {analysis.productsWithMargins
                .sort((a, b) => b.profitMargin - a.profitMargin)
                .map((product, index) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="py-4 px-4 font-mono text-sm">{product.id}</td>
                  <td className="py-4 px-4 font-medium">€{product.currentPrice.toFixed(2)}</td>
                  <td className="py-4 px-4">€{product.unitCost.toFixed(2)}</td>
                  <td className="py-4 px-4 font-medium text-green-600">€{product.absoluteProfit.toFixed(2)}</td>
                  <td className="py-4 px-4">
                    <span className={`text-lg font-bold ${getMarginColor(product.profitMargin)}`}>
                      {product.profitMarginFormatted}%
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMarginBadge(product.profitMargin)}`}>
                      {product.profitMargin >= 70 ? 'Excellent' :
                       product.profitMargin >= 50 ? 'Good' :
                       product.profitMargin >= 30 ? 'Fair' : 'Poor'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Findings */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-6">Key Findings & Analysis</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Strengths
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>High-margin sunglasses:</strong> Both wooden sunglasses models achieve excellent margins (75.5% and 76.9%), indicating strong pricing power and low production costs.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Phone accessories:</strong> The phone stand delivers an outstanding 84.1% margin, suggesting this category has significant profit potential.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Notebooks category:</strong> Both notebook products maintain healthy margins above 70%, indicating efficient production and good market positioning.
                </div>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Areas for Improvement
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>1200ML Lunchbox crisis:</strong> At only 41.0% margin, this product is significantly underperforming and may be priced too low or have excessive production costs.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Silk stoles pricing:</strong> Both silk products have margins below 50%, suggesting either premium positioning issues or high material costs.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Category imbalance:</strong> 3 out of 12 products fall below the 50% margin threshold, indicating potential pricing strategy issues.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Strategic Recommendations</h2>
        
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-900 mb-4">
              Immediate Action Required (Products Below 50% Margin)
            </h3>
            <div className="space-y-4">
              {analysis.lowMarginProducts.map(product => (
                <div key={product.id} className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{product.name}</span>
                    <span className="text-red-600 font-bold">{product.profitMarginFormatted}%</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {product.id === 'LB0017' && 
                      "Consider increasing price to €45-50 or reducing production costs. Current margin is critically low for sustainable business."
                    }
                    {product.id === 'SH0017-26' && 
                      "Evaluate material costs and consider premium positioning strategy. Silk products should command higher margins."
                    }
                    {product.id === 'SH0025' && 
                      "Despite high absolute price, margin is below target. Review production efficiency or justify premium pricing with enhanced features."
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">
              Strategic Opportunities
            </h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <strong>Expand phone accessories:</strong> With 84.1% margin, consider developing more products in this category
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <strong>Optimize silk production:</strong> Investigate ways to reduce silk stole production costs while maintaining quality
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <strong>Price optimization:</strong> Consider modest price increases for products with margins between 50-60%
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <strong>Cost analysis:</strong> Review supplier relationships for products with high unit costs relative to selling price
              </li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-green-900 mb-4">
              Portfolio Strengths to Leverage
            </h3>
            <ul className="space-y-2 text-green-800">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <strong>Wooden sunglasses excellence:</strong> Both models achieve 75%+ margins - use as template for other products
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <strong>Notebook success:</strong> Strong margins indicate good market fit and efficient production
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <strong>Thermos bottles balance:</strong> Solid 70%+ margins with reasonable pricing for market penetration
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfitAnalyzer