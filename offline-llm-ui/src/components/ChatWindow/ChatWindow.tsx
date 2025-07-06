// src/components/ChatWindow/ChatWindow.tsx
import { Box, VStack, Text } from "@chakra-ui/react"
import { useChat } from "../../contexts/ChatContext"

export function ChatWindow() {
  const { messages } = useChat()
  return (
    <VStack align="stretch" spacing={2} overflowY="auto">
      {messages.map((m, i) => (
        <Box
          key={i}
          bg={m.from === "user" ? "blue.50" : "gray.100"}
          p={2}
          borderRadius="md"
          alignSelf={m.from === "user" ? "flex-end" : "flex-start"}
        >
          <Text>{m.text}</Text>
        </Box>
      ))}
    </VStack>
  )
}
