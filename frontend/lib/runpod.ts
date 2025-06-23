import type { MessageInterface } from "@/types/types"
import { API_KEY, API_URL } from "@/config/runpod-configs"

async function callChatBotAPI(messages: MessageInterface[]): Promise<MessageInterface> {
  try {
    console.log("🚀 Calling RunPod API...")
    console.log("📝 Message count:", messages.length)

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        input: { messages },
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()

    // Handle different RunPod statuses
    if (data.status === "IN_QUEUE" || data.status === "IN_PROGRESS") {
      return {
        role: "assistant",
        content: "I'm thinking about your request... Give me just a moment! ☕",
      }
    }

    if (data.status === "COMPLETED" && data.output) {
      console.log("✅ RunPod API Success")
      return data.output
    }

    // Fallback response
    return {
      role: "assistant",
      content: "Hello! I'm your coffee assistant. How can I help you today? ☕",
    }
  } catch (error) {
    console.error("❌ Error calling the API:", error)
    throw error
  }
}

export { callChatBotAPI }
