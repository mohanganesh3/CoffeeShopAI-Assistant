// Utility functions for managing product image mappings
import { addProductImageMapping, PRODUCT_IMAGE_URLS } from './product-image-mapping'

/**
 * Add multiple product image mappings at once
 */
export function addBulkProductMappings(mappings: { [productName: string]: string }): void {
  for (const [name, url] of Object.entries(mappings)) {
    addProductImageMapping(name, url)
  }
}

/**
 * Get all available product mappings
 */
export function getAllProductMappings(): { [key: string]: string } {
  return { ...PRODUCT_IMAGE_URLS }
}

/**
 * Search for products with available image mappings
 */
export function searchProductMappings(searchTerm: string): string[] {
  const term = searchTerm.toLowerCase()
  return Object.keys(PRODUCT_IMAGE_URLS).filter(product => 
    product.includes(term)
  )
}

/**
 * Add common coffee shop product variations
 */
export function addCommonVariations(): void {
  const variations = {
    // Size variations
    'small latte': PRODUCT_IMAGE_URLS['latte'],
    'medium latte': PRODUCT_IMAGE_URLS['latte'],
    'large latte': PRODUCT_IMAGE_URLS['latte'],
    'small cappuccino': PRODUCT_IMAGE_URLS['cappuccino'],
    'medium cappuccino': PRODUCT_IMAGE_URLS['cappuccino'],
    'large cappuccino': PRODUCT_IMAGE_URLS['cappuccino'],
    
    // Temperature variations
    'hot latte': PRODUCT_IMAGE_URLS['latte'],
    'iced latte': PRODUCT_IMAGE_URLS['iced coffee'],
    'hot cappuccino': PRODUCT_IMAGE_URLS['cappuccino'],
    'iced cappuccino': PRODUCT_IMAGE_URLS['iced coffee'],
    
    // Common alternate names
    'cafe latte': PRODUCT_IMAGE_URLS['latte'],
    'caffe latte': PRODUCT_IMAGE_URLS['latte'],
    'cafe au lait': PRODUCT_IMAGE_URLS['latte'],
    'flat white': PRODUCT_IMAGE_URLS['latte'],
    'cortado': PRODUCT_IMAGE_URLS['cappuccino'],
    
    // Pastry variations
    'pain au chocolat': PRODUCT_IMAGE_URLS['chocolate croissant'],
    'chocolatine': PRODUCT_IMAGE_URLS['chocolate croissant'],
    'butter croissant': PRODUCT_IMAGE_URLS['croissant'],
    'plain croissant': PRODUCT_IMAGE_URLS['croissant'],
  }
  
  addBulkProductMappings(variations)
}

/**
 * Check if a product has an image mapping
 */
export function hasImageMapping(productName: string): boolean {
  const normalizedName = productName.toLowerCase().trim()
  return Object.keys(PRODUCT_IMAGE_URLS).some(key => 
    key === normalizedName || 
    normalizedName.includes(key) || 
    key.includes(normalizedName)
  )
}

// Automatically add common variations when this module is imported
addCommonVariations()