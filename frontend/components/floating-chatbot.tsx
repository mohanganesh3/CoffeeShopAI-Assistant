"use client"

import { useState, useEffect } from "react"
import { Coffee, Sparkles, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export default function FloatingChatbot() {
  const [showBubble, setShowBubble] = useState(true)

  // Auto-show bubble again after 15 seconds if hidden
  useEffect(() => {
    if (!showBubble) {
      const timer = setTimeout(() => {
        setShowBubble(true)
      }, 15000)
      return () => clearTimeout(timer)
    }
  }, [showBubble])

  return (
    <div className="fixed bottom-12 right-12 z-50">
      <div className="relative">
        {/* Chat Bubble - Always comes back */}
        {showBubble && (
          <div className="glass-card p-10 mb-10 max-w-2xl animate-bounce shadow-2xl rounded-3xl">
            <div className="flex items-start space-x-8">
              <div className="w-24 h-24 premium-gradient rounded-2xl flex items-center justify-center flex-shrink-0 pulse-glow">
                <Coffee className="text-white h-12 w-12" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <p className="text-3xl font-bold text-amber-900">Need help choosing?</p>
                  <Sparkles className="h-8 w-8 text-amber-600" />
                </div>
                <p className="text-xl text-amber-700 font-semibold leading-relaxed mb-6">
                  Chat with me for personalized coffee recommendations! I'll help you find your perfect brew! ☕✨
                </p>
                <Link href="/chat">
                  <Button className="premium-gradient text-white px-8 py-6 rounded-xl font-bold text-xl hover:scale-105 transition-all duration-300">
                    Start Chat
                    <ArrowRight className="h-6 w-6 ml-3" />
                  </Button>
                </Link>
              </div>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => setShowBubble(false)}
                className="h-14 w-14 p-0 text-amber-600 hover:text-amber-800 hover:bg-amber-100/50 rounded-xl"
              >
                <X className="h-8 w-8" />
              </Button>
            </div>
          </div>
        )}

        {/* Main Chat Button - Always visible */}
        <Link href="/chat">
          <Button
            size="lg"
            className="premium-gradient text-white rounded-full w-32 h-32 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 pulse-glow float-animation p-0 overflow-hidden"
          >
            <Image 
              src="/assets/coding.png"
              alt="Chat Bot"
              width={80}
              height={80}
              className="object-contain brightness-0 invert"
              priority
            />
          </Button>
        </Link>
      </div>
    </div>
  )
}
