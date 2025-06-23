"use client"

import { useState, useEffect } from "react"
import { Coffee, Sparkles, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

export default function FloatingChatbot() {
  const [showBubble, setShowBubble] = useState(true)
  const pathname = usePathname()
  
  // Auto-show bubble again after 15 seconds if hidden
  useEffect(() => {
    if (!showBubble) {
      const timer = setTimeout(() => {
        setShowBubble(true)
      }, 15000)
      return () => clearTimeout(timer)
    }
  }, [showBubble])
  
  // Don't show on chat page
  if (pathname === "/chat") {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <div className="relative">
        {/* Chat Bubble - Always comes back */}
        {showBubble && (
          <div className="glass-card p-6 mb-6 max-w-md animate-bounce shadow-2xl rounded-2xl">
            <div className="flex items-start space-x-8">
              <div className="w-16 h-16 premium-gradient rounded-xl flex items-center justify-center flex-shrink-0 pulse-glow">
                <Coffee className="text-white h-8 w-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <p className="text-2xl font-bold text-amber-900">Need help choosing?</p>
                  <Sparkles className="h-6 w-6 text-amber-600" />
                </div>
                <p className="text-lg text-amber-700 font-semibold leading-relaxed mb-4">
                  Chat with me for personalized coffee recommendations! I'll help you find your perfect brew! ☕✨
                </p>
                <Link href="/chat">
                  <Button className="premium-gradient text-white px-6 py-4 rounded-lg font-bold text-lg hover:scale-105 transition-all duration-300">
                    Start Chat
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowBubble(false)}
                className="h-10 w-10 p-0 text-amber-600 hover:text-amber-800 hover:bg-amber-100/50 rounded-lg"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>
        )}

        {/* Main Chat Button - Always visible */}
        <Link href="/chat">
          <Button
            size="icon"
            className="premium-gradient text-white rounded-full w-16 h-16 aspect-square shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 pulse-glow float-animation p-0 overflow-hidden"
          >
            <Image 
              src="/assets/coding.png"
              alt="Chat Bot"
              width={48}
              height={48}
              className="object-contain brightness-0 invert"
              priority
            />
          </Button>
        </Link>
      </div>
    </div>
  )
}
