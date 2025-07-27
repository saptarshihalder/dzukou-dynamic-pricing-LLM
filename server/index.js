import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import csvParser from 'csv-parser'
import createCsvWriter from 'csv-writer'
import { Readable } from 'stream'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '../dist')))

// File upload configuration
const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true)
    } else {
      cb(new Error('Only CSV files are allowed'))
    }
  }
})

// In-memory storage for demo purposes
let products = []
let scrapingStatus = {
  isRunning: false,
  progress: 0,
  currentStore: '',
  logs: [],
  results: []
}
let optimizationResults = null
let dashboardData = null

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9)

const addLog = (message) => {
  const timestamp = new Date().toISOString().substr(11, 8)
  scrapingStatus.logs.push({ timestamp, message })
  console.log(`[${timestamp}] ${message}`)
}

// Mock scraping function
const mockScrapeStore = async (storeName, products) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockResults = products.map(product => ({
        category: product.category,
        store: storeName,
        product_name: `${product.name} - Competitor`,
        price: (parseFloat(product.currentPrice) * (0.8 + Math.random() * 0.4)).toFixed(2),
        search_term: product.keywords?.split(',')[0] || product.category.toLowerCase(),
        store_url: `https://${storeName.toLowerCase().replace(/\s+/g, '')}.com`
      }))
      resolve(mockResults)
    }, 2000 + Math.random() * 3000)
  })
}

// Mock optimization function
const mockOptimizePrice = (product, competitorPrices) => {
  const currentPrice = parseFloat(product.currentPrice)
  const unitCost = parseFloat(product.unitCost)
  const avgCompetitorPrice = competitorPrices.length > 0 
    ? competitorPrices.reduce((sum, p) => sum + parseFloat(p.price), 0) / competitorPrices.length
    : currentPrice

  // Simple optimization logic
  const targetPrice = Math.min(
    currentPrice * 1.3, // Max 30% increase
    Math.max(
      unitCost * 1.2, // Min 20% margin
      avgCompetitorPrice * 0.95 // Slightly below competitor average
    )
  )

  const priceChange = ((targetPrice - currentPrice) / currentPrice * 100)
  const profitImpact = (targetPrice - unitCost) * 100 - (currentPrice - unitCost) * 100 // Assuming 100 units sold

  return {
    productName: product.name,
    productId: product.id,
    category: product.category,
    currentPrice: currentPrice.toFixed(2),
    recommendedPrice: targetPrice.toFixed(2),
    priceChange: priceChange.toFixed(1),
    profitImpact: profitImpact.toFixed(2),
    confidence: Math.abs(priceChange) > 10 ? 'High' : 'Medium',
    competitorCount: competitorPrices.length,
    avgCompetitorPrice: avgCompetitorPrice.toFixed(2)
  }
}

// API Routes

// Products endpoints
app.get('/api/products', (req, res) => {
  res.json(products)
})

app.post('/api/products', (req, res) => {
  const product = {
    id: req.body.id || generateId(),
    name: req.body.name,
    category: req.body.category,
    currentPrice: parseFloat(req.body.currentPrice),
    unitCost: parseFloat(req.body.unitCost),
    keywords: req.body.keywords,
    createdAt: new Date().toISOString()
  }
  
  products.push(product)
  res.json({ success: true, product })
})

app.post('/api/products/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const results = []
    const stream = Readable.from(await fs.readFile(req.file.path, 'utf8'))
    
    stream
      .pipe(csvParser())
      .on('data', (data) => {
        const product = {
          id: data['Product ID'] || generateId(),
          name: data['Product Name'],
          category: data['Category'],
          currentPrice: parseFloat(data['Current Price']),
          unitCost: parseFloat(data['Unit Cost']),
          keywords: data['Keywords'],
          createdAt: new Date().toISOString()
        }
        results.push(product)
      })
      .on('end', () => {
        products.push(...results)
        fs.unlink(req.file.path) // Clean up uploaded file
        res.json({ success: true, count: results.length })
      })
      .on('error', (error) => {
        res.status(500).json({ error: 'Error parsing CSV file' })
      })
  } catch (error) {
    res.status(500).json({ error: 'Error processing file upload' })
  }
})

// Scraper endpoints
app.post('/api/scraper/start', async (req, res) => {
  if (scrapingStatus.isRunning) {
    return res.status(400).json({ error: 'Scraping already in progress' })
  }

  scrapingStatus = {
    isRunning: true,
    progress: 0,
    currentStore: '',
    logs: [],
    results: []
  }

  res.json({ success: true })

  // Start scraping process
  const stores = ['EarthHero', 'Package Free Shop', 'Ten Thousand Villages', 'Made Trade', 'Zero Waste Store']
  const totalStores = stores.length
  
  addLog('Starting competitor data collection...')
  
  for (let i = 0; i < stores.length; i++) {
    const store = stores[i]
    scrapingStatus.currentStore = store
    scrapingStatus.progress = (i / totalStores) * 100
    
    addLog(`Scraping ${store}...`)
    
    try {
      const results = await mockScrapeStore(store, products)
      scrapingStatus.results.push(...results)
      addLog(`Found ${results.length} products from ${store}`)
    } catch (error) {
      addLog(`Error scraping ${store}: ${error.message}`)
    }
  }
  
  scrapingStatus.progress = 100
  scrapingStatus.isRunning = false
  scrapingStatus.currentStore = ''
  addLog('Data collection completed successfully!')
})

app.get('/api/scraper/progress', (req, res) => {
  res.json({
    progress: scrapingStatus.progress,
    currentStore: scrapingStatus.currentStore,
    logs: scrapingStatus.logs,
    completed: !scrapingStatus.isRunning && scrapingStatus.progress === 100,
    error: false,
    results: scrapingStatus.results
  })
})

app.post('/api/scraper/stop', (req, res) => {
  scrapingStatus.isRunning = false
  addLog('Scraping stopped by user')
  res.json({ success: true })
})

// Optimizer endpoints
app.post('/api/optimizer/start', async (req, res) => {
  try {
    const { products: productList, settings } = req.body
    
    // Mock optimization process
    const recommendations = productList.map(product => {
      const competitorPrices = scrapingStatus.results.filter(r => 
        r.category.toLowerCase() === product.category.toLowerCase()
      )
      return mockOptimizePrice(product, competitorPrices)
    })

    const totalProfitIncrease = recommendations.reduce((sum, rec) => 
      sum + parseFloat(rec.profitImpact), 0
    )
    
    const avgPriceChange = recommendations.reduce((sum, rec) => 
      sum + parseFloat(rec.priceChange), 0
    ) / recommendations.length

    optimizationResults = {
      recommendations,
      totalProfitIncrease,
      avgPriceChange,
      productsOptimized: recommendations.length,
      significantChanges: recommendations.filter(r => Math.abs(parseFloat(r.priceChange)) > 5).length
    }

    res.json(optimizationResults)
  } catch (error) {
    res.status(500).json({ error: 'Error running optimization' })
  }
})

// Dashboard endpoints
app.get('/api/dashboard/data', (req, res) => {
  if (!optimizationResults) {
    return res.json(null)
  }

  // Generate dashboard data
  dashboardData = {
    ...optimizationResults,
    priceIncreases: optimizationResults.recommendations.filter(r => parseFloat(r.priceChange) > 0).length,
    priceDecreases: optimizationResults.recommendations.filter(r => parseFloat(r.priceChange) < 0).length,
    noChange: optimizationResults.recommendations.filter(r => parseFloat(r.priceChange) === 0).length,
    currentProfit: products.reduce((sum, p) => sum + (p.currentPrice - p.unitCost) * 100, 0),
    projectedProfit: products.reduce((sum, p) => sum + (p.currentPrice - p.unitCost) * 100, 0) + optimizationResults.totalProfitIncrease,
    categoryAnalysis: {}
  }

  // Generate category analysis
  const categories = [...new Set(products.map(p => p.category))]
  categories.forEach(category => {
    const categoryRecs = optimizationResults.recommendations.filter(r => r.category === category)
    dashboardData.categoryAnalysis[category] = {
      productCount: categoryRecs.length,
      avgPriceChange: categoryRecs.reduce((sum, r) => sum + parseFloat(r.priceChange), 0) / categoryRecs.length,
      profitImpact: categoryRecs.reduce((sum, r) => sum + parseFloat(r.profitImpact), 0)
    }
  })

  res.json(dashboardData)
})

app.get('/api/dashboard/export', async (req, res) => {
  const format = req.query.format || 'csv'
  
  if (!optimizationResults) {
    return res.status(400).json({ error: 'No data to export' })
  }

  if (format === 'csv') {
    const csvWriter = createCsvWriter.createObjectCsvStringifier({
      header: [
        { id: 'productName', title: 'Product Name' },
        { id: 'category', title: 'Category' },
        { id: 'currentPrice', title: 'Current Price' },
        { id: 'recommendedPrice', title: 'Recommended Price' },
        { id: 'priceChange', title: 'Price Change %' },
        { id: 'profitImpact', title: 'Profit Impact' },
        { id: 'confidence', title: 'Confidence' }
      ]
    })

    const csvString = csvWriter.getHeaderString() + csvWriter.stringifyRecords(optimizationResults.recommendations)
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=pricing-recommendations.csv')
    res.send(csvString)
  } else {
    res.status(400).json({ error: 'Unsupported format' })
  }
})

app.post('/api/dashboard/generate', (req, res) => {
  // Generate HTML dashboard (simplified version)
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Dzukou Pricing Dashboard</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { display: inline-block; margin: 10px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .metric h3 { margin: 0; color: #333; }
        .metric .value { font-size: 24px; font-weight: bold; color: #2563eb; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
      </style>
    </head>
    <body>
      <h1>Dzukou Pricing Dashboard</h1>
      <div class="metrics">
        <div class="metric">
          <h3>Total Profit Increase</h3>
          <div class="value">€${optimizationResults?.totalProfitIncrease?.toFixed(2) || '0.00'}</div>
        </div>
        <div class="metric">
          <h3>Products Optimized</h3>
          <div class="value">${optimizationResults?.productsOptimized || 0}</div>
        </div>
        <div class="metric">
          <h3>Avg Price Change</h3>
          <div class="value">${optimizationResults?.avgPriceChange?.toFixed(1) || '0.0'}%</div>
        </div>
      </div>
      
      <h2>Recommendations</h2>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Current Price</th>
            <th>Recommended Price</th>
            <th>Change</th>
            <th>Profit Impact</th>
          </tr>
        </thead>
        <tbody>
          ${optimizationResults?.recommendations?.map(rec => `
            <tr>
              <td>${rec.productName}</td>
              <td>€${rec.currentPrice}</td>
              <td>€${rec.recommendedPrice}</td>
              <td>${rec.priceChange}%</td>
              <td>€${rec.profitImpact}</td>
            </tr>
          `).join('') || ''}
        </tbody>
      </table>
    </body>
    </html>
  `
  
  res.setHeader('Content-Type', 'text/html')
  res.send(html)
})

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})