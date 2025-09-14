"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Star, Plus, Minus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Header from "@/components/layout/header"
import { fetchProducts, type Product } from "@/lib/firebase"
import { useCart } from "@/lib/cart-context"
import { useToast } from "@/hooks/use-toast"

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [categories, setCategories] = useState<string[]>([])

  const { cartItems, addToCart, SetQuantityCart } = useCart()
  const { toast } = useToast()

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setError(null)
        const fetchedProducts = await fetchProducts()
        setProducts(fetchedProducts)
        setFilteredProducts(fetchedProducts)

        // Extract unique categories
        const uniqueCategories = ["All", ...new Set(fetchedProducts.map((p) => p.category))]
        setCategories(uniqueCategories)
      } catch (error) {
        console.error("Error loading products:", error)
        setError("Failed to load menu items from Firebase. Please check your database connection.")
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  useEffect(() => {
    let filtered = products

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((product) => product.category === selectedCategory)
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, selectedCategory])

  const handleAddToCart = (product: Product) => {
    addToCart(product.name, 1)
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart!`,
    })
  }

  const handleQuantityChange = (productName: string, delta: number) => {
    SetQuantityCart(productName, delta)
  }

  if (loading) {
    return (
      <div className="min-h-screen cream-gradient">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="glass-morphism animate-pulse">
                <CardContent className="p-6">
                  <div className="bg-amber-200 h-48 rounded-lg mb-4"></div>
                  <div className="bg-amber-200 h-4 rounded mb-2"></div>
                  <div className="bg-amber-200 h-3 rounded w-2/3 mb-4"></div>
                  <div className="bg-amber-200 h-8 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen cream-gradient">
      <Header />

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-amber-900 mb-4">Our Menu</h1>
          <p className="text-xl text-amber-700 max-w-2xl mx-auto">
            Discover our carefully crafted selection of premium coffees, delicious pastries, and artisanal treats
          </p>
        </div>
      </section>

      {error && (
        <section className="px-4 mb-8">
          <div className="container mx-auto">
            <Alert className="max-w-2xl mx-auto border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">{error}</AlertDescription>
            </Alert>
          </div>
        </section>
      )}

      {products.length > 0 && (
        <>
          {/* Search and Filter Section */}
          <section className="px-4 mb-8">
            <div className="container mx-auto">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 h-4 w-4" />
                  <Input
                    placeholder="Search for your favorite coffee..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-amber-200 focus:border-amber-400 bg-white/80"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-amber-600" />
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={
                        selectedCategory === category
                          ? "coffee-gradient text-white"
                          : "border-amber-200 text-amber-800 hover:bg-amber-50"
                      }
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Results Count */}
              <div className="mb-6">
                <p className="text-amber-700">
                  Showing {filteredProducts.length} of {products.length} items
                  {searchTerm && ` for "${searchTerm}"`}
                  {selectedCategory !== "All" && ` in ${selectedCategory}`}
                </p>
              </div>
            </div>
          </section>

          {/* Products Grid */}
          <section className="px-4 pb-20">
            <div className="container mx-auto">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20">
                  <div className="coffee-gradient p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <Search className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-amber-900 mb-4">No items found</h3>
                  <p className="text-amber-700 mb-6">Try adjusting your search terms or browse a different category</p>
                  <Button
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedCategory("All")
                    }}
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const quantity = cartItems[product.name] || 0
                    return (
                      <Card
                        key={product.id}
                        className="glass-morphism border-amber-200/30 hover:scale-105 transition-all duration-300 coffee-shadow group"
                      >
                        <CardContent className="p-6">
                          {/* Product Image */}
                          <div className="relative overflow-hidden rounded-lg mb-4">
                            <img
                              src={product.image_url || "/placeholder.svg?height=200&width=300"}
                              alt={product.name}
                              className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute top-2 right-2 bg-amber-600 text-white px-3 py-1 rounded-full font-bold">
                              ${product.price.toFixed(2)}
                            </div>
                            <Badge className="absolute top-2 left-2 bg-amber-100 text-amber-800">
                              {product.category}
                            </Badge>
                          </div>

                          {/* Product Info */}
                          <div className="space-y-3">
                            <div>
                              <h3 className="text-lg font-bold text-amber-900 mb-1">{product.name}</h3>
                              <div className="flex items-center space-x-1 mb-2">
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                <span className="text-sm font-medium text-amber-800">{product.rating}</span>
                              </div>
                            </div>

                            <p className="text-amber-700 text-sm line-clamp-2">{product.description}</p>

                            {/* Add to Cart Controls */}
                            <div className="flex items-center justify-between pt-2">
                              {quantity === 0 ? (
                                <Button
                                  onClick={() => handleAddToCart(product)}
                                  className="coffee-gradient hover:scale-105 transition-all duration-200 text-white flex-1"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add to Cart
                                </Button>
                              ) : (
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center space-x-3 bg-amber-100 rounded-lg p-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleQuantityChange(product.name, -1)}
                                      className="h-8 w-8 p-0 text-amber-800 hover:bg-amber-200"
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="font-bold text-amber-900 min-w-[20px] text-center">
                                      {quantity}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleQuantityChange(product.name, 1)}
                                      className="h-8 w-8 p-0 text-amber-800 hover:bg-amber-200"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-amber-700">Total</p>
                                    <p className="font-bold text-amber-900">${(product.price * quantity).toFixed(2)}</p>
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
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
