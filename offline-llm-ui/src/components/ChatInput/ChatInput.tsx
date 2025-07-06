// src/components/ChatInput/ChatInput.tsx
import { useState } from "react"
import { Input, Button, HStack } from "@chakra-ui/react"
import { useChat } from "../../contexts/ChatContext"

export default function ChatInput() {
  const { sendMessage } = useChat()
  const [text, setText] = useState("")

  const onSend = async () => {
    if (!text.trim()) return
    await sendMessage(text.trim())
    setText("")
  }

  return (
    <HStack>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your message…"
        onKeyDown={(e) => e.key === "Enter" && onSend()}
      />
      <Button onClick={onSend}>Send</Button>
    </HStack>
  )
}
