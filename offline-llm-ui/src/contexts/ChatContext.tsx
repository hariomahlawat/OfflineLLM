// src/contexts/ChatContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react"
import { chat } from "../api"

interface ChatContextValue {
  sessionId: string
  model: string
  setModel: (m: string) => void
  messages: { from: "user" | "assistant"; text: string }[]
  sendMessage: (text: string) => Promise<void>
  sending: boolean        // <--- Add this
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessionId] = useState(() => crypto.randomUUID())
  const [model, setModel] = useState<string>("llama3:8b-instruct-q3_K_L")
  const [messages, setMessages] = useState<
    { from: "user" | "assistant"; text: string }[]
  >([])
  const [sending, setSending] = useState(false)        // <--- Add this

  async function sendMessage(text: string) {
    setMessages((m) => [...m, { from: "user", text }])
    setSending(true)                                  // <--- Set true before sending
    try {
      const { answer } = await chat(sessionId, text, model)
      setMessages((m) => [...m, { from: "assistant", text: answer }])
    } finally {
      setSending(false)                               // <--- Always set false after
    }
  }

  return (
    <ChatContext.Provider
      value={{ sessionId, model, setModel, messages, sendMessage, sending }} // <--- Add sending here
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChat must be inside ChatProvider")
  return ctx
}
