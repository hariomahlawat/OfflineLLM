// src/App.tsx
import { HStack, VStack, Box } from '@chakra-ui/react'
import { ChatProvider } from './contexts/ChatContext'
import { ModelSelector } from './components/ModelSelector/ModelSelector'
import { ChatWindow } from './components/ChatWindow/ChatWindow'
import ChatInput from './components/ChatInput/ChatInput'
import { DocQaPanel } from './components/DocQaPanel/DocQaPanel'

console.log("🔥 main.tsx is loaded");

export default function App() {
   console.log('App mounted')
  return (
    <ChatProvider>
      
      <HStack align="stretch" h="100vh" p={4} spacing={4}>
        {/* Left: Document QA panel */}
        <Box w="50%" flex="1" overflowY="auto">
          <DocQaPanel />
        </Box>

        {/* Right: Chat */}
        <VStack flex="1" spacing={4} align="stretch">
          <Box>
            <ModelSelector />
          </Box>
          <Box w="50%" flex="1" overflowY="auto">
            <ChatWindow />
          </Box>
          <Box>
            <ChatInput />
          </Box>
        </VStack>
      </HStack>
    </ChatProvider>
  )
}
