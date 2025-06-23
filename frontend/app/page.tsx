"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Search, Filter, Plus, Minus, Star, Coffee, AlertCircle, Sparkles, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { fetchProducts, type Product } from "@/lib/firebase"
import { useCart } from "@/lib/cart-context"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function ProfessionalKiosk() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [categories, setCategories] = useState<string[]>([])

  const { cartItems, addToCart, SetQuantityCart, getTotalItems, getTotalPrice } = useCart()
  const { toast } = useToast()

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("🚀 Starting to load products...")
      const fetchedProducts = await fetchProducts()

      if (!fetchedProducts || fetchedProducts.length === 0) {
        throw new Error("No products available in Firebase database")
      }

      setProducts(fetchedProducts)
      setFilteredProducts(fetchedProducts)

      // Extract unique categories from Firebase data
      const uniqueCategories = ["All", ...new Set(fetchedProducts.map((p) => p.category).filter(Boolean))]
      setCategories(uniqueCategories)

      console.log("✅ Products loaded successfully:", fetchedProducts.length)
    } catch (error) {
      console.error("❌ Error loading products:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setError(`Failed to load products: ${errorMessage}`)

      // Clear any existing data on error
      setProducts([])
      setFilteredProducts([])
      setCategories(["All"])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter((product) => product.category === selectedCategory)
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, selectedCategory])

  const handleAddToCart = (product: Product) => {
    addToCart(product.name, 1)
    toast({
      title: "Added to Cart! ✨",
      description: `${product.name} added successfully`,
    })
  }

  const handleQuantityChange = (productName: string, delta: number) => {
    SetQuantityCart(productName, delta)
  }

  const handleRetry = () => {
    loadProducts()
  }

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice(products)

  return (
    <div className="min-h-screen flex justify-center">
      <div className="transform scale-80 origin-top w-full">
        {/* Header */}
        <header className="glass-card sticky top-6 z-40 mx-6 mt-6 rounded-3xl">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 premium-gradient rounded-3xl flex items-center justify-center pulse-glow">
                  <Coffee className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-premium">BrewBuddy</h1>
                  <p className="text-xl text-amber-700 font-semibold">Coffee Kiosk</p>
                </div>
              </div>

              {/* Cart Button */}
              <Link href="/cart">
                <Button className="relative premium-gradient text-white px-10 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
                  <ShoppingCart className="h-8 w-8 mr-4" />
                  Cart
                  {totalItems > 0 && (
                    <span className="absolute -top-4 -right-4 bg-red-500 text-white text-lg rounded-full h-10 w-10 flex items-center justify-center font-bold pulse-glow">
                      {totalItems}
                    </span>
                  )}
                  {totalPrice > 0 && <span className="ml-4 text-2xl">${totalPrice.toFixed(2)}</span>}
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Title */}
          <div className="text-center mb-12">
            <h2 className="text-7xl font-bold text-premium mb-6 float-animation">Our Menu</h2>
            <p className="text-3xl text-amber-800 font-medium">Choose Your Perfect Coffee Experience</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-8">
              <Alert className="glass-card border-red-300 bg-red-50/80 rounded-2xl p-6">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <AlertDescription className="text-red-800 text-xl font-semibold ml-4">
                  <div className="flex items-center justify-between">
                    <span>{error}</span>
                    <Button
                      onClick={handleRetry}
                      variant="outline"
                      size="sm"
                      className="ml-4 border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Search and Filter - Only show if we have products */}
          {products.length > 0 && (
            <div className="mb-12 space-y-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Search */}
                <div className="relative flex-1 max-w-3xl mx-auto lg:mx-0">
                  <div className="relative">
                    <Search className="absolute left-8 top-1/2 transform -translate-y-1/2 text-amber-600 h-8 w-8 z-10" />
                    <Input
                      placeholder="Search for your perfect coffee..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-20 pr-8 h-20 text-2xl glass-card border-0 rounded-2xl placeholder:text-amber-600/70 text-amber-900 font-semibold shadow-lg focus:ring-2 focus:ring-amber-400"
                      style={{ fontSize: '24px', letterSpacing: '0.2px' }}
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-6 flex-wrap justify-center lg:justify-start">
                  <Filter className="h-8 w-8 text-amber-700" />
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category)}
                      className={
                        selectedCategory === category
                          ? "premium-gradient text-white px-8 py-4 text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                          : "ceramic-card text-amber-800 px-8 py-4 text-xl font-bold rounded-2xl hover:text-amber-900"
                      }
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Results Count */}
              <p className="text-2xl text-amber-700 font-semibold text-center">
                {selectedCategory === "All" 
                  ? `Showing all ${filteredProducts.length} delicious coffees`
                  : `Showing ${filteredProducts.length} ${selectedCategory} products`
                }
              </p>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <div key={i} className="ceramic-card animate-pulse p-6 rounded-3xl">
                  <div className="bg-gradient-to-br from-amber-200 to-orange-200 h-56 rounded-2xl mb-6"></div>
                  <div className="bg-gradient-to-r from-amber-200 to-orange-200 h-8 rounded-2xl mb-6"></div>
                  <div className="bg-gradient-to-r from-amber-200 to-orange-200 h-6 rounded-xl w-2/3 mb-8"></div>
                  <div className="bg-gradient-to-r from-amber-200 to-orange-200 h-16 rounded-2xl"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="w-40 h-40 glass-card rounded-full mx-auto mb-12 flex items-center justify-center float-animation">
                <AlertCircle className="h-20 w-20 text-red-600" />
              </div>
              <h3 className="text-5xl font-bold text-red-600 mb-8">Firebase Connection Error</h3>
              <p className="text-2xl text-red-700 mb-12 font-medium">Unable to load products from Firebase database</p>
              <Button
                onClick={handleRetry}
                className="premium-gradient text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
              >
                <RefreshCw className="h-6 w-6 mr-3" />
                Try Again
              </Button>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
              {filteredProducts.map((product) => {
                const quantity = cartItems[product.name] || 0
                return (
                  <Card
                    key={product.id}
                    className="ceramic-card p-6 rounded-3xl hover:scale-105 transition-all duration-500 w-full"
                  >
                    <CardContent className="p-0">
                      {/* Product Image */}
                      <div className="relative overflow-hidden rounded-2xl mb-6 group">
                        <img
                          src={product.image_url || "/placeholder.svg?height=400&width=500"}
                          alt={product.name}
                          className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div 
                          className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        />
                        <Badge 
                          className="absolute top-6 left-6 glass-card text-amber-800 font-bold text-lg px-4 py-2 rounded-xl" 
                          style={{ zIndex: 20 }}
                        >
                          {product.category || "Unknown"}
                        </Badge>
                        <div className="absolute top-4 right-6 premium-gradient text-white px-6 py-3 rounded-2xl font-bold text-xl shadow-xl" style={{ zIndex: 30 }}>
                          ${product.price?.toFixed(2) || "0.00"}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-3xl font-bold text-amber-900 mb-3">{product.name || "Unknown Product"}</h3>
                          <div className="flex items-center space-x-3 mb-4">
                            <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                            <span className="text-xl font-bold text-amber-800">{product.rating || "N/A"}</span>
                          </div>
                        </div>

                        <p className="text-amber-700 text-lg line-clamp-3 leading-relaxed font-medium">
                          {product.description || "No description available"}
                        </p>

                        {/* Add to Cart Controls */}
                        <div className="pt-6">
                          {quantity === 0 ? (
                            <Button
                              onClick={() => handleAddToCart(product)}
                              className="w-full premium-gradient text-white h-16 text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            >
                              <Plus className="h-6 w-6 mr-3" />
                              Add to Cart
                            </Button>
                          ) : (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between glass-card p-6 rounded-2xl">
                                <Button
                                  size="lg"
                                  variant="ghost"
                                  onClick={() => handleQuantityChange(product.name, -1)}
                                  className="h-16 w-16 p-0 hover:bg-amber-200/50 rounded-2xl"
                                >
                                  <Minus className="h-8 w-8 text-amber-800" />
                                </Button>
                                <span className="font-bold text-3xl text-amber-900">{quantity}</span>
                                <Button
                                  size="lg"
                                  variant="ghost"
                                  onClick={() => handleQuantityChange(product.name, 1)}
                                  className="h-16 w-16 p-0 hover:bg-amber-200/50 rounded-2xl"
                                >
                                  <Plus className="h-8 w-8 text-amber-800" />
                                </Button>
                              </div>
                              <div className="text-center glass-card p-4 rounded-2xl">
                                <p className="text-lg text-amber-700 font-semibold">Subtotal</p>
                                <p className="font-bold text-3xl text-amber-900">
                                  ${((product.price || 0) * quantity).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-40 h-40 glass-card rounded-full mx-auto mb-12 flex items-center justify-center float-animation">
                <Coffee className="h-20 w-20 text-amber-600" />
              </div>
              <h3 className="text-5xl font-bold text-premium mb-8">No Products in Firebase</h3>
              <p className="text-2xl text-amber-700 mb-12 font-medium">Please add products to your Firebase database.</p>
              <Button
                onClick={handleRetry}
                className="premium-gradient text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
              >
                <RefreshCw className="h-6 w-6 mr-3" />
                Check Again
              </Button>
            </div>
          )}

          {filteredProducts.length === 0 && !loading && !error && products.length > 0 && (
            <div className="text-center py-20">
              <div className="w-40 h-40 glass-card rounded-full mx-auto mb-12 flex items-center justify-center float-animation">
                <Search className="h-20 w-20 text-amber-600" />
              </div>
              <h3 className="text-5xl font-bold text-premium mb-8">No items found</h3>
              <p className="text-2xl text-amber-700 mb-12 font-medium">Try adjusting your search or filter criteria</p>
              <Button
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory("All")
                }}
                className="ceramic-card text-amber-800 px-12 py-6 text-xl font-bold rounded-2xl hover:scale-105 transition-all duration-300"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
