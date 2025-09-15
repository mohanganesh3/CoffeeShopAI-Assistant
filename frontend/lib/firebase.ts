import { fireBaseDB } from "../config/firebase-config"
import type { Product } from "../types/types"
import { ref, get } from "firebase/database"
import { getProductImageUrl } from "../config/product-image-mapping"
import "../config/image-mapping-utils" // Load common variations

const fetchProducts = async (): Promise<Product[]> => {
  try {
    console.log("🔄 Fetching products from Firebase...")
    console.log("🔗 Database URL:", process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL)

    const productsRef = ref(fireBaseDB, "products")
    const snapshot = await get(productsRef)

    if (!snapshot.exists()) {
      console.log("⚠️ No products found in Firebase database")
      throw new Error("No products found in Firebase database. Please add products to your database.")
    }

    const data = snapshot.val()
    console.log("📦 Raw Firebase data:", data)

    const productsMap = new Map<string, Product>() // Use Map to ensure unique products by name

    if (data && typeof data === "object") {
      for (const key in data) {
        if (data.hasOwnProperty(key) && data[key]) {
          const productData = data[key]
          const product = {
            id: key,
            ...productData,
            // Use web image URL mapping instead of Firebase storage
            image_url: getProductImageUrl(productData.name, productData.image_path),
          }

          // Validate required fields
          if (product.name && product.price && product.category) {
            // Use product name as key to ensure uniqueness
            if (!productsMap.has(product.name)) {
              productsMap.set(product.name, product)
            } else {
              console.warn(`⚠️ Duplicate product found with name: ${product.name}, using first instance`)
            }
          } else {
            console.warn(`⚠️ Invalid product data for key ${key}:`, product)
          }
        }
      }
    }

    const products = Array.from(productsMap.values())

    if (products.length === 0) {
      throw new Error("No valid products found in Firebase database. Please check your data structure.")
    }

    console.log(`✅ Successfully loaded ${products.length} unique products from Firebase`)
    console.log(
      "📋 Products:",
      products.map((p) => ({ id: p.id, name: p.name, price: p.price })),
    )

    return products
  } catch (error) {
    console.error("❌ Error fetching products from Firebase:", error)

    if (error instanceof Error) {
      throw new Error(`Firebase Error: ${error.message}`)
    } else {
      throw new Error("Failed to connect to Firebase database")
    }
  }
}

export { fetchProducts }
export type { Product }
