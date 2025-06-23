"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Send, Bot, User, Loader2, ArrowLeft, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { callChatBotAPI } from "@/lib/runpod"
import { useCart } from "@/lib/cart-context"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  memory?: any
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { addToCart, cartItems, getTotalItems } = useCart()
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    // Welcome message
    const welcomeMessage: ChatMessage = {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your coffee assistant! ☕ I can help you find the perfect drink, answer questions about our menu, or take your order. What would you like today?",
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
  }, [])

  const updateCartFromMemory = (memory: any) => {
    if (memory?.order && Array.isArray(memory.order)) {
      memory.order.forEach((item: any) => {
        if (item.item && item.quantity) {
          const currentQuantity = cartItems[item.item] || 0
          const newQuantity = item.quantity - currentQuantity
          if (newQuantity > 0) {
            addToCart(item.item, newQuantity)
            toast({
              title: "Added to Cart",
              description: `${item.item} added to your order!`,
            })
          }
        }
      })
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)
    setIsTyping(true)

    try {
      const messagesToSend = [...messages, userMessage].map(({ id, timestamp, ...msg }) => msg)
      const response = await callChatBotAPI(messagesToSend)

      setIsTyping(false)

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        memory: response.memory,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Update cart if there are orders in memory
      if (response.memory) {
        updateCartFromMemory(response.memory)
      }
    } catch (error) {
      setIsTyping(false)
      console.error("Error sending message:", error)

      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having a quick coffee break! ☕ Please try again in a moment.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickActions = [
    "I'd like a latte",
    "What's popular today?",
    "Show me pastries",
    "Something strong please",
    "What do you recommend?",
  ]

  const totalItems = getTotalItems()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/">
                <Button variant="ghost" size="lg" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-6 w-6 mr-3" />
                  <span className="text-lg">Back to Menu</span>
                </Button>
              </Link>
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-amber-600 rounded-xl flex items-center justify-center">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Coffee Assistant</h1>
                  <p className="text-base text-gray-500">Ask me anything about our menu!</p>
                </div>
              </div>
            </div>

            <Link href="/cart">
              <Button className="relative bg-amber-600 hover:bg-amber-700 text-white px-8 py-6 text-lg h-auto">
                <ShoppingCart className="h-6 w-6 mr-3" />
                Cart
                {totalItems > 0 && (
                  <span className="absolute -top-3 -right-3 bg-red-500 text-white text-sm rounded-full h-7 w-7 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Chat Container */}
        <Card className="border-gray-200 shadow-lg rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardContent className="p-0">
            {/* Messages Area */}
            <div className="h-[650px] overflow-y-auto p-8 space-y-6 bg-gradient-to-b from-amber-50/50 to-white">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`flex items-start space-x-4 max-w-[85%] ${
                      message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-transform duration-200 hover:scale-105 ${
                        message.role === "user" ? "bg-gray-700 text-white" : "bg-amber-600 text-white"
                      }`}
                    >
                      {message.role === "user" ? <User className="h-7 w-7" /> : <span className="text-xl">☕</span>}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl px-6 py-5 text-lg shadow-md transition-all duration-200 hover:shadow-lg ${
                        message.role === "user"
                          ? "bg-amber-600 text-white"
                          : "bg-white border border-gray-100 text-gray-900"
                      }`}
                    >
                      {message.content}
                      
                      {/* Order Summary - Preserving cart functionality */}
                      {message.memory?.order && message.memory.order.length > 0 && (
                        <div className="mt-4 p-4 bg-white/90 rounded-2xl border border-amber-200">
                          <p className="text-base font-semibold text-amber-800 mb-3">Current Order:</p>
                          {message.memory.order.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between text-base text-amber-700">
                              <span>
                                {item.quantity}x {item.item}
                              </span>
                              <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-sm opacity-70 mt-3">
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-md bg-amber-600 text-white">
                      <span className="text-xl">☕</span>
                    </div>
                    <div className="rounded-2xl px-6 py-5 bg-white border border-gray-100 shadow-md">
                      <Loader2 className="h-7 w-7 animate-spin text-amber-600" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="p-6 border-t border-gray-100 bg-white">
              <div className="flex flex-wrap gap-3">
                {quickActions.map((action) => (
                  <Button
                    key={action}
                    variant="outline"
                    className="text-gray-700 text-base px-5 py-5 h-auto rounded-xl border-2 hover:bg-amber-50 hover:border-amber-200 transition-all duration-200"
                    onClick={() => {
                      setInputMessage(action)
                      handleSendMessage()
                    }}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-gray-100 bg-gradient-to-b from-white to-amber-50/30">
              <div className="flex space-x-4">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about our menu, get recommendations, or place an order..."
                  className="text-lg py-6 px-5 rounded-2xl border-2 border-gray-200 focus:border-amber-400 focus:ring-amber-400 transition-all duration-200 shadow-sm hover:shadow-md"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  size="lg"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-8 h-auto py-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Send className="h-7 w-7" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
