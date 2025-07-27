import React from 'react'
import { 
  ShoppingCart, 
  Database, 
  TrendingUp, 
  BarChart3, 
  ArrowRight,
  CheckCircle,
  Lightbulb
} from 'lucide-react'

const Tutorial = ({ onGetStarted }) => {
  const steps = [
    {
      icon: ShoppingCart,
      title: 'Add Your Products',
      description: 'Start by adding your products with their current prices and costs. Our system will help you categorize them for better analysis.',
      features: ['Product information management', 'Category assignment', 'Cost tracking']
    },
    {
      icon: Database,
      title: 'Collect Competitor Data',
      description: 'Automatically scrape competitor prices from sustainable online stores to understand your market position.',
      features: ['Multi-store price collection', 'Real-time data gathering', 'Automated categorization']
    },
    {
      icon: TrendingUp,
      title: 'Optimize Your Prices',
      description: 'Use advanced algorithms to find the optimal price points that maximize your profit while staying competitive.',
      features: ['Profit maximization', 'Market positioning', 'Statistical analysis']
    },
    {
      icon: BarChart3,
      title: 'View Results & Insights',
      description: 'Get comprehensive dashboards with pricing recommendations, profit projections, and actionable insights.',
      features: ['Interactive dashboards', 'Profit analysis', 'Export capabilities']
    }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Dzukou Pricing Toolkit
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Optimize your product pricing with data-driven insights and competitor analysis
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div className="text-left">
              <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
              <p className="text-blue-800">
                This toolkit helps you analyze competitor prices and recommend optimal pricing for your products. 
                Follow the 4-step process to get data-driven pricing recommendations that maximize your profits 
                while keeping you competitive in the market.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 mb-12">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={index} className="card">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-primary-600 text-white text-sm font-bold px-2 py-1 rounded">
                      Step {index + 1}
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    {step.description}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {step.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-center">
        <button 
          onClick={onGetStarted}
          className="btn-primary text-lg px-8 py-4"
        >
          Get Started
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-sm text-gray-500 mt-4">
          Ready to optimize your pricing? Let's start by adding your first product.
        </p>
      </div>
    </div>
  )
}

export default Tutorial