"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

// Define the type for the cart items
type CartItems = {
  [key: string]: number // key is the product ID, value is the quantity
}

interface CartContextType {
  cartItems: CartItems
  addToCart: (itemKey: string, quantity: number) => void
  SetQuantityCart: (itemKey: string, delta: number) => void
  emptyCart: () => void
  getTotalItems: () => number
  getTotalPrice: (products: any[]) => number
}

// Create a Cart Context
const CartContext = createContext<CartContextType | undefined>(undefined)

// Create a provider component
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItems>({})

  const SetQuantityCart = (itemKey: string, delta: number) => {
    setCartItems((prevItems) => ({
      ...prevItems,
      [itemKey]: Math.max((prevItems[itemKey] || 0) + delta, 0),
    }))
  }

  const addToCart = (itemKey: string, quantity: number) => {
    setCartItems((prevItems) => ({
      ...prevItems,
      [itemKey]: (prevItems[itemKey] || 0) + quantity,
    }))
  }

  const emptyCart = () => {
    setCartItems({})
  }

  const getTotalItems = () => {
    return Object.values(cartItems).reduce((total, quantity) => total + quantity, 0)
  }

  const getTotalPrice = (products: any[]) => {
    return Object.entries(cartItems).reduce((total, [itemName, quantity]) => {
      const product = products.find((p) => p.name === itemName)
      return total + (product ? product.price * quantity : 0)
    }, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        emptyCart,
        SetQuantityCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// Custom hook for using cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
