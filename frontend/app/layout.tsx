import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { CartProvider } from "@/lib/cart-context"
import { Toaster } from "@/components/ui/toaster"
import FloatingChatbot from "@/components/floating-chatbot"

export const metadata: Metadata = {
  title: "BrewBuddy - Coffee Kiosk",
  description: "Professional coffee ordering kiosk with AI assistant",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <CartProvider>
          {children}
          <FloatingChatbot />
          <Toaster />
        </CartProvider>
      </body>
    </html>
  )
}
