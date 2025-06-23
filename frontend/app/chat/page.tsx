"use client"

import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import {
  Send,
  Bot,
  User,
  ArrowLeft,
  ShoppingCart,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { callChatBotAPI } from "@/lib/runpod"
import { useCart } from "@/lib/cart-context"
import { useToast } from "@/hooks/use-toast"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  memory?: any
}

const quickActions = [
  "I'd like a latte",
  "What's popular today?",
  
]

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { addToCart, cartItems, getTotalItems } = useCart()
  const { toast } = useToast()

  /** Scroll helper */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  /** Load welcome message */
  useEffect(() => {
    const welcome: ChatMessage = {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your coffee assistant ☕️. Ask me anything about our menu or tell me what you'd like!",
      timestamp: new Date(),
    }
    setMessages([welcome])
  }, [])

  /** Auto-scroll when new messages arrive */
  useEffect(scrollToBottom, [messages])

  /** Handle cart memory updates */
  const syncOrderWithCart = (memory: any) => {
    if (!memory?.order) return
    memory.order.forEach((item: any) => {
      if (item.item && item.quantity) {
        addToCart(item.item, item.quantity)
        toast({
          title: "Added to cart",
          description: `${item.quantity}× ${item.item}`,
        })
      }
    })
  }

  /** Send message */
  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const payload = [...messages, userMsg].map(({ id, timestamp, ...m }) => m)
      const res = await callChatBotAPI(payload)

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.content,
        memory: res.memory,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMsg])
      syncOrderWithCart(res.memory)
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "Sorry, I'm having a coffee break ☕ – please try again!",
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  /** Handle enter key */
  const onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      sendMessage()
    }
  }

  const totalItems = getTotalItems()

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50">
      {/* Header */}
      <header className="w-full bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-amber-700 hover:text-amber-900">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center text-white">
                <Bot className="h-5 w-5" />
              </div>
              <h1 className="text-lg font-bold text-amber-900">Coffee Assistant</h1>
            </div>
          </div>

          <Link href="/cart">
            <Button className="relative bg-amber-600 hover:bg-amber-700 text-white px-3 py-2">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-xs text-white rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </header>

      {/* Chat card */}
      <main className="flex flex-col flex-1 items-center px-2 py-4">
        <Card className="flex flex-col w-full max-w-3xl flex-1 shadow-xl">
          <CardContent className="flex flex-col flex-1 p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6" id="chat-scroll-area">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] flex space-x-3 ${m.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
                    {/* Avatar */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md ${
                        m.role === "user" ? "bg-amber-600 text-white" : "bg-white border"
                      }`}
                    >
                      {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-amber-600" />}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`px-4 py-3 rounded-xl shadow-md text-sm leading-relaxed whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-amber-600 text-white"
                          : "bg-white border border-gray-200 text-gray-900"
                      }`}
                    >
                      <ReactMarkdown>{m.content}</ReactMarkdown>

                      {/* Order summary */}
                      {m.memory?.order?.length > 0 && (
                        <div className="mt-3 border-t pt-3 space-y-1">
                          {m.memory.order.map((it: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-xs text-amber-800">
                              <span>
                                {it.quantity} × {it.item}
                              </span>
                              <span>${(it.price * it.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-2 text-[10px] opacity-60 text-right">
                        {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex space-x-3 items-start">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center shadow-sm">
                      <Bot className="h-4 w-4 text-amber-600" />
                    </div>
                    {/* Spinner bubble */}
                    <div className="px-4 py-3 rounded-xl bg-white border shadow-md">
                      <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick actions */}
            <div className="px-4 pb-3">
              <div className="flex flex-wrap gap-2">
                {quickActions.map((qa) => (
                  <Button
                    key={qa}
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      setInput(qa)
                      sendMessage()
                    }}
                  >
                    {qa}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input bar */}
            <div className="border-t p-3 bg-white/90 backdrop-blur sticky bottom-0 flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={onKeyPress}
                placeholder="Ask about our menu, get recommendations, or place an order..."
                className="text-sm flex-1"
                disabled={loading}
              />
              <Button onClick={sendMessage} disabled={loading || !input.trim()} size="icon" className="bg-amber-600 hover:bg-amber-700">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
