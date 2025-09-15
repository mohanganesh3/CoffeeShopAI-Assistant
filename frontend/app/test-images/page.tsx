'use client'

import React from 'react'
import { getProductImageUrl } from '@/config/product-image-mapping'

// Mock product data for the products mentioned in the issue
const problemProducts = [
  { name: 'Jumbo Savory Scone', category: 'Bakery', price: 3.99 },
  { name: 'Chocolate Chip Biscotti', category: 'Bakery', price: 2.49 },
  { name: 'Hazelnut Biscotti', category: 'Bakery', price: 2.49 },
  { name: 'Cranberry Scone', category: 'Bakery', price: 2.99 },
  { name: 'Croissant', category: 'Bakery', price: 2.79 },
  { name: 'Ginger Biscotti', category: 'Bakery', price: 2.49 },
  { name: 'Oatmeal Scone', category: 'Bakery', price: 2.99 },
  { name: 'Ginger Scone', category: 'Bakery', price: 2.99 },
  { name: 'Hazelnut syrup', category: 'Flavours', price: 0.75 },
  { name: 'Sugar Free Vanilla syrup', category: 'Flavours', price: 0.75 }
]

export default function ImageTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 p-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-900 mb-4">
            Image Mapping Test - Problem Products Fixed
          </h1>
          <p className="text-lg text-amber-700">
            Demonstrating that all products mentioned in the issue now have proper image mappings
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {problemProducts.map((product, index) => {
            const imageUrl = getProductImageUrl(product.name)
            const isLocalImage = imageUrl.startsWith('/fallback-images/')
            
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      console.log(`Image failed to load for ${product.name}: ${imageUrl}`)
                      e.currentTarget.src = '/placeholder.svg?height=200&width=300'
                    }}
                    onLoad={() => {
                      console.log(`✅ Image loaded successfully for ${product.name}: ${imageUrl}`)
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                    ${product.price}
                  </div>
                  <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                    {isLocalImage ? 'LOCAL' : 'EXTERNAL'}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Category: {product.category}
                  </p>
                  <p className="text-xs text-gray-500 truncate" title={imageUrl}>
                    Image: {imageUrl}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Image Mapping Status</h2>
          <div className="space-y-2">
            {problemProducts.map((product, index) => {
              const imageUrl = getProductImageUrl(product.name)
              const isLocalImage = imageUrl.startsWith('/fallback-images/')
              const isExternalImage = imageUrl.startsWith('https://')
              
              return (
                <div key={index} className="flex items-center justify-between py-2 border-b">
                  <span className="font-medium">{product.name}</span>
                  <div className="flex items-center space-x-2">
                    {isLocalImage && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        ✅ Local Image
                      </span>
                    )}
                    {isExternalImage && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        🌐 External Image
                      </span>
                    )}
                    {!isLocalImage && !isExternalImage && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                        ❌ No Image
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}