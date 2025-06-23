"use client"

import { Coffee, ShoppingBag, MessageCircle, MenuIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import Link from "next/link"
import { useState } from "react"

export default function Header() {
  const { getTotalItems } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const totalItems = getTotalItems()

  return (
    <header className="sticky top-0 z-50 glass-morphism border-b border-amber-200/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="coffee-gradient p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Coffee className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-amber-900">BrewBuddy</h1>
              <p className="text-xs text-amber-700">AI Coffee Assistant</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-amber-800 hover:text-amber-600 transition-colors font-medium">
              Home
            </Link>
            <Link href="/menu" className="text-amber-800 hover:text-amber-600 transition-colors font-medium">
              Menu
            </Link>
            <Link href="/chat" className="text-amber-800 hover:text-amber-600 transition-colors font-medium">
              Chat
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Link href="/chat">
              <Button variant="ghost" size="sm" className="hidden sm:flex text-amber-800 hover:text-amber-600">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </Link>

            <Link href="/cart">
              <Button variant="ghost" size="sm" className="relative text-amber-800 hover:text-amber-600">
                <ShoppingBag className="h-4 w-4" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-amber-800"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <MenuIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-amber-200/20 pt-4">
            <div className="flex flex-col space-y-3">
              <Link href="/" className="text-amber-800 hover:text-amber-600 transition-colors font-medium">
                Home
              </Link>
              <Link href="/menu" className="text-amber-800 hover:text-amber-600 transition-colors font-medium">
                Menu
              </Link>
              <Link href="/chat" className="text-amber-800 hover:text-amber-600 transition-colors font-medium">
                Chat with BrewBuddy
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
