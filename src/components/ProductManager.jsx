import React, { useState } from 'react'
import { 
  Plus, 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  ArrowRight,
  Package,
  DollarSign,
  Tag,
  RefreshCw,
  FileText
} from 'lucide-react'

const ProductManager = ({ products, onProductAdded, onNext }) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [isLoadingCSV, setIsLoadingCSV] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    id: '',
    category: '',
    currentPrice: '',
    unitCost: '',
    keywords: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = [
    'Sunglasses',
    'Bottles', 
    'Coffee mugs',
    'Phone accessories',
    'Notebook',
    'Lunchbox',
    'Premium shawls',
    'Eri silk shawls',
    'Cotton scarf',
    'Other scarves and shawls'
  ]

  const loadExistingData = async () => {
    setIsLoadingCSV(true)
    try {
      const response = await fetch('/api/products/load-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        onProductAdded()
        alert(`Successfully loaded ${data.count} products from CSV!`)
      } else {
        throw new Error('Failed to load CSV data')
      }
    } catch (error) {
      console.error('Error loading CSV:', error)
      alert('Error loading CSV data. Please try again.')
    } finally {
      setIsLoadingCSV(false)
    }
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onProductAdded()
        setFormData({
          name: '',
          id: '',
          category: '',
          currentPrice: '',
          unitCost: '',
          keywords: ''
        })
        setShowAddForm(false)
      } else {
        throw new Error('Failed to add product')
      }
    } catch (error) {
      console.error('Error adding product:', error)
      alert('Error adding product. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/products/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        onProductAdded()
        alert('Products uploaded successfully!')
      } else {
        throw new Error('Failed to upload file')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error uploading file. Please try again.')
    }
  }

  const downloadTemplate = () => {
    const csvContent = "Product Name,Product ID,Category,Current Price,Unit Cost,Keywords\nExample Product,PROD001,Sunglasses,45.99,20.00,\"wooden sunglasses, eco-friendly\""
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'product_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Manage Your Products
        </h1>
        <p className="text-gray-600">
          Add your products with their current pricing information. This data will be used to analyze competitor prices and optimize your pricing strategy.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button 
          onClick={loadExistingData}
          disabled={isLoadingCSV}
          className="btn-primary disabled:opacity-50"
        >
          {isLoadingCSV ? (
            <>
              <RefreshCw className="w-5 h-5 loading-spinner" />
              Loading...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Load Existing CSV
            </>
          )}
        </button>
        
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
        
        <label className="btn-secondary cursor-pointer">
          <Upload className="w-5 h-5" />
          Upload CSV
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
        
        <button 
          onClick={downloadTemplate}
          className="btn-secondary"
        >
          <Download className="w-5 h-5" />
          Download Template
        </button>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div className="card mb-8 fade-in">
          <h2 className="text-xl font-semibold mb-6">Add New Product</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., Reiek Peak Wooden Sunglasses"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product ID *
                </label>
                <input
                  type="text"
                  name="id"
                  value={formData.id}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., SG0001"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Price (€) *
                </label>
                <input
                  type="number"
                  name="currentPrice"
                  value={formData.currentPrice}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="45.99"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Cost (€) *
                </label>
                <input
                  type="number"
                  name="unitCost"
                  value={formData.unitCost}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="20.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="wooden sunglasses, eco-friendly, sustainable"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-primary disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Product'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Your Products ({products.length})</h2>
          {products.length > 0 && (
            <button 
              onClick={onNext}
              className="btn-primary"
            >
              Next: Collect Data
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-6">
              Add your first product to get started with pricing optimization
            </p>
            <button 
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              <Plus className="w-5 h-5" />
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Current Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Unit Cost</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Margin</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => {
                  const margin = ((product.currentPrice - product.unitCost) / product.currentPrice * 100).toFixed(1)
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.id}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium">€{product.currentPrice}</td>
                      <td className="py-4 px-4">€{product.unitCost}</td>
                      <td className="py-4 px-4">
                        <span className={`font-medium ${margin > 30 ? 'text-green-600' : margin > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {margin}%
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button className="text-gray-400 hover:text-gray-600">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductManager