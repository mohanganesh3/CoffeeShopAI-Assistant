# Product Image Mapping System

This document describes the image mapping system that replaces Firebase image URLs with reliable web URLs.

## Overview

The Firebase image links were not working properly, showing empty images. This system replaces them with high-quality images from reliable sources like Unsplash.

## Files Modified

1. **`config/product-image-mapping.ts`** - Main mapping configuration
2. **`config/image-mapping-utils.ts`** - Utility functions for managing mappings
3. **`lib/firebase.ts`** - Updated to use the mapping system

## How It Works

### 1. Product Image Mapping (`product-image-mapping.ts`)

Contains a comprehensive mapping of product names to image URLs:

```typescript
export const PRODUCT_IMAGE_URLS: ProductImageMapping = {
  'latte': 'https://images.unsplash.com/photo-...',
  'cappuccino': 'https://images.unsplash.com/photo-...',
  // ... more mappings
}
```

### 2. Smart Matching Algorithm

The `getProductImageUrl()` function uses smart matching:

1. **Exact match** - Direct lookup by product name
2. **Partial match** - Checks if product name contains mapped keywords
3. **Fallback** - Uses local images if available
4. **Default** - Returns a default coffee image

### 3. Firebase Integration

The Firebase service now uses this mapping instead of broken Firebase storage URLs:

```typescript
const product = {
  id: key,
  ...productData,
  image_url: getProductImageUrl(productData.name, productData.image_path),
}
```

## Benefits

✅ **No broken images** - All images come from reliable sources  
✅ **Smart matching** - Handles variations in product names  
✅ **Fallback system** - Uses local images if needed  
✅ **Easy maintenance** - Simple to add new products  
✅ **High quality** - Professional Unsplash images  

## Adding New Products

To add image mappings for new products:

```typescript
import { addProductImageMapping } from './config/product-image-mapping'

// Add a single product
addProductImageMapping('new product', 'https://example.com/image.jpg')

// Or add multiple products
import { addBulkProductMappings } from './config/image-mapping-utils'

addBulkProductMappings({
  'product 1': 'https://example.com/image1.jpg',
  'product 2': 'https://example.com/image2.jpg'
})
```

## Supported Products

The system currently includes mappings for:

- **Coffee beverages**: espresso, latte, cappuccino, americano, macchiato, mocha, etc.
- **Pastries**: croissants, muffins, danish, etc.  
- **Scones**: cranberry, ginger, oatmeal, savory, etc.
- **Biscotti**: chocolate, hazelnut, ginger, etc.
- **Syrups**: vanilla, caramel, hazelnut, chocolate, etc.

## Image Sources

- **Primary**: High-quality Unsplash images (free to use)
- **Fallback**: Local images in `public/fallback-images/` directory
- **Default**: Generic coffee image for unknown products

## Testing

Run the demo to see how the mapping works:

```bash
node /tmp/demo-image-mapping.js
```

This shows how different product names get mapped to appropriate image URLs.