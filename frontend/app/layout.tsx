import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/lib/cart-context"
import { Toaster } from "@/components/ui/toaster"
import FloatingChatbot from "@/components/floating-chatbot"

const inter = Inter({ subsets: ["latin"] })

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
      <body className={inter.className}>
        <CartProvider>
          {children}
          <FloatingChatbot />
          <Toaster />
        </CartProvider>
      </body>
    </html>
  )
}
