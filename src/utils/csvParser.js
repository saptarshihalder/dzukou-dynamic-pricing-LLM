/**
 * Parse CSV data from the existing Dzukou pricing overview file
 */

export const parseExistingCSV = (csvText) => {
  const lines = csvText.split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  const products = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = parseCSVLine(line)
    if (values.length < headers.length) continue

    const product = {}
    headers.forEach((header, index) => {
      product[header] = values[index]?.trim() || ''
    })

    // Convert to our format
    const formattedProduct = {
      id: product['Product ID'] || generateId(),
      name: product['Product Name'] || '',
      category: categorizeProduct(product['Product Name'] || ''),
      currentPrice: parseFloat(product[' Current Price ']?.replace('€', '').replace(',', '') || '0'),
      unitCost: parseFloat(product[' Unit Cost ']?.replace('€', '').replace(',', '') || '0'),
      keywords: generateKeywords(product['Product Name'] || ''),
      createdAt: new Date().toISOString()
    }

    if (formattedProduct.name && formattedProduct.currentPrice > 0) {
      products.push(formattedProduct)
    }
  }

  return products
}

const parseCSVLine = (line) => {
  const values = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  values.push(current)
  return values
}

const categorizeProduct = (productName) => {
  const name = productName.toLowerCase()
  
  if (name.includes('sunglasses')) return 'Sunglasses'
  if (name.includes('bottle') || name.includes('thermos')) return 'Bottles'
  if (name.includes('mug') || name.includes('coffee')) return 'Coffee mugs'
  if (name.includes('phone') || name.includes('stand')) return 'Phone accessories'
  if (name.includes('notebook') || name.includes('journal')) return 'Notebook'
  if (name.includes('lunch') || name.includes('box')) return 'Lunchbox'
  if (name.includes('silk') && name.includes('stole')) {
    if (name.includes('white')) return 'Other scarves and shawls'
    return 'Other scarves and shawls'
  }
  if (name.includes('premium') && name.includes('shawl')) return 'Premium shawls'
  if (name.includes('eri') && name.includes('silk')) return 'Eri silk shawls'
  if (name.includes('cotton') && name.includes('scarf')) return 'Cotton scarf'
  if (name.includes('shawl') || name.includes('scarf') || name.includes('stole')) return 'Other scarves and shawls'
  
  return 'Other scarves and shawls'
}

const generateKeywords = (productName) => {
  const name = productName.toLowerCase()
  const keywords = []
  
  if (name.includes('wooden') && name.includes('sunglasses')) {
    keywords.push('wooden sunglasses', 'eco sunglasses', 'sustainable eyewear')
  } else if (name.includes('thermos') || name.includes('bottle')) {
    keywords.push('thermos bottle', 'insulated bottle', 'water bottle')
  } else if (name.includes('coffee') && name.includes('mug')) {
    keywords.push('coffee mug', 'ceramic mug', 'eco mug')
  } else if (name.includes('phone') && name.includes('stand')) {
    keywords.push('phone stand', 'wooden phone stand', 'desk stand')
  } else if (name.includes('notebook')) {
    keywords.push('eco notebook', 'sustainable journal', 'recycled paper')
  } else if (name.includes('lunch') && name.includes('box')) {
    if (name.includes('1200ml')) {
      keywords.push('1200ml lunch box', 'large lunch container')
    } else if (name.includes('800ml')) {
      keywords.push('800ml lunch box', 'medium lunch container')
    } else {
      keywords.push('lunch box', 'food container')
    }
  } else if (name.includes('silk') && name.includes('stole')) {
    if (name.includes('white')) {
      keywords.push('white silk stole', 'white silk scarf')
    } else {
      keywords.push('silk colored stole', 'silk scarf', 'colorful stole')
    }
  }
  
  return keywords.join(', ')
}

const generateId = () => Math.random().toString(36).substr(2, 9)