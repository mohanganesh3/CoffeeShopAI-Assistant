"use client"

import { useState, useEffect } from "react"
import { Trash2, Plus, Minus, ArrowLeft, CreditCard, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { fetchProducts, type Product } from "@/lib/firebase"
import { useCart } from "@/lib/cart-context"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function CartPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { cartItems, SetQuantityCart, emptyCart, getTotalPrice } = useCart()
  const { toast } = useToast()

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const fetchedProducts = await fetchProducts()
        setProducts(fetchedProducts)
      } catch (error) {
        console.error("Error loading products:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const cartProducts = products.filter((product) => cartItems[product.name] > 0)
  const totalPrice = getTotalPrice(products)
  const tax = totalPrice * 0.08
  const finalTotal = totalPrice + tax

  const handleQuantityChange = (productName: string, delta: number) => {
    SetQuantityCart(productName, delta)
  }

  const handleRemoveItem = (productName: string) => {
    const currentQuantity = cartItems[productName] || 0
    SetQuantityCart(productName, -currentQuantity)
    toast({
      title: "✨ Item Removed",
      description: `${productName} removed from cart`,
    })
  }

  const handleCheckout = () => {
    toast({
      title: "🎉 Order Placed Successfully!",
      description: "Your delicious coffee is being prepared. Thank you!",
      duration: 5000,
    })
    emptyCart()
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="fixed inset-0 cream-gradient -z-10"></div>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="glass-card h-16 rounded-2xl"></div>
            <div className="glass-card h-40 rounded-2xl"></div>
            <div className="glass-card h-40 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 cream-gradient -z-10"></div>

      {/* Header */}
      <header className="glass-card sticky top-4 z-40 mx-4 mt-4">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-amber-700 hover:text-amber-900 hover:bg-amber-100/50 rounded-xl px-6 py-3"
                >
                  <ArrowLeft className="h-6 w-6 mr-3" />
                  <span className="text-lg font-semibold">Back to Menu</span>
                </Button>
              </Link>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🛒</span>
                </div>
                <h1 className="text-3xl font-bold text-gradient">Your Order</h1>
              </div>
            </div>
            {cartProducts.length > 0 && (
              <Button
                variant="ghost"
                onClick={emptyCart}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl px-6 py-3 text-lg font-semibold"
              >
                <Trash2 className="h-5 w-5 mr-3" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {cartProducts.length === 0 ? (
          /* Empty Cart */
          <div className="text-center py-20">
            <div className="w-40 h-40 glass-card rounded-full mx-auto mb-8 flex items-center justify-center floating-animation">
              <span className="text-6xl">🛒</span>
            </div>
            <h2 className="text-5xl font-bold text-gradient mb-6">Your cart is empty</h2>
            <p className="text-2xl text-amber-700 mb-12 font-medium">Add some delicious items to get started!</p>
            <Link href="/">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-12 py-6 text-xl font-semibold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
              >
                <Sparkles className="h-6 w-6 mr-3" />
                Browse Menu
              </Button>
            </Link>
          </div>
        ) : (
          /* Cart with Items */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-3xl font-bold text-gradient mb-6">Order Items ({cartProducts.length})</h2>

              {cartProducts.map((product) => {
                const quantity = cartItems[product.name]
                const itemTotal = product.price * quantity

                return (
                  <Card key={product.id} className="ceramic-card p-6">
                    <CardContent className="p-0">
                      <div className="flex items-center space-x-6">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={product.image_url || "/placeholder.svg?height=120&width=120"}
                            alt={product.name}
                            className="w-24 h-24 object-cover rounded-2xl"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-2xl font-bold text-amber-900 mb-2">{product.name}</h3>
                          <p className="text-lg text-amber-700 mb-3 font-medium">{product.category}</p>
                          <p className="text-xl font-bold text-amber-900">${product.price.toFixed(2)} each</p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-3 glass-card p-3 rounded-xl">
                            <Button
                              size="lg"
                              variant="ghost"
                              onClick={() => handleQuantityChange(product.name, -1)}
                              className="h-12 w-12 p-0 hover:bg-amber-200/50 rounded-xl"
                            >
                              <Minus className="h-6 w-6 text-amber-800" />
                            </Button>
                            <span className="font-bold text-2xl min-w-[40px] text-center text-amber-900">
                              {quantity}
                            </span>
                            <Button
                              size="lg"
                              variant="ghost"
                              onClick={() => handleQuantityChange(product.name, 1)}
                              className="h-12 w-12 p-0 hover:bg-amber-200/50 rounded-xl"
                            >
                              <Plus className="h-6 w-6 text-amber-800" />
                            </Button>
                          </div>

                          <div className="text-right min-w-[100px]">
                            <p className="text-2xl font-bold text-amber-900">${itemTotal.toFixed(2)}</p>
                          </div>

                          <Button
                            size="lg"
                            variant="ghost"
                            onClick={() => handleRemoveItem(product.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl p-3"
                          >
                            <Trash2 className="h-6 w-6" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="ceramic-card sticky top-32 p-6">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-2xl font-bold text-gradient">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-6">
                  {/* Price Breakdown */}
                  <div className="space-y-4">
                    <div className="flex justify-between text-xl text-amber-700 font-medium">
                      <span>Subtotal</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl text-amber-700 font-medium">
                      <span>Tax (8%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <Separator className="bg-amber-200" />
                    <div className="flex justify-between text-3xl font-bold text-gradient">
                      <span>Total</span>
                      <span>${finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-8 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 mb-6"
                  >
                    <CreditCard className="mr-3 h-6 w-6" />
                    Place Order
                  </Button>

                  {/* Continue Shopping */}
                  <Link href="/" className="block">
                    <Button className="w-full ceramic-card text-amber-800 py-6 text-lg font-semibold rounded-2xl hover:scale-105 transition-all duration-300">
                      <ArrowLeft className="mr-3 h-5 w-5" />
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
