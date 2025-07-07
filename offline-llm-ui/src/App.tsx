import { useState, useRef } from "react";
import { HStack, Box, useBreakpointValue, Text } from '@chakra-ui/react'
import { ChatProvider } from './contexts/ChatContext'
import { AppHeader } from './components/AppHeader/AppHeader'
import { ChatWindow } from './components/ChatWindow/ChatWindow'
import ChatInput from './components/ChatInput/ChatInput'
import { DocQaPanel } from './components/DocQaPanel/DocQaPanel'
import { AppFooter } from './components/AppFooter/AppFooter'

export default function App() {
  const [leftPercent, setLeftPercent] = useState(40);
  const isStacked = useBreakpointValue({ base: true, md: false });
  const dragging = useRef(false);

  function startDrag(_e: any) {
    if (isStacked) return;
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    function onMove(ev: { clientX: number }) {
      const total = window.innerWidth;
      let pct = Math.max(18, Math.min(82, (ev.clientX / total) * 100));
      setLeftPercent(pct);
    }
    function onUp() {
      dragging.current = false;
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <ChatProvider>
      <Box minH="100vh" w="100vw" bg="gray.50" display="flex" flexDirection="column">
        <AppHeader />
        {/* Main content: FULL WIDTH, NO maxW, NO mx="auto" */}
        <Box flex="1" minH={0} display="flex" flexDirection="column" w="100vw">
          <HStack
            align="stretch"
            spacing={0}
            flex="1"
            h="100%"
            w="100%"
            position="relative"
            overflow="hidden"
          >
            {/* Doc QA Panel */}
            <Box
              width={isStacked ? "100%" : `${leftPercent}%`}
              minW="240px"
              transition="width 0.15s"
              bg="blue.50"
              borderRightWidth={isStacked ? 0 : 1}
              borderColor="blue.200"
              zIndex={1}
              overflow="hidden"
              display="flex"
              flexDirection="column"
              boxShadow="md"
              position="relative"
              h="100%"
            >
              <Box px={4} py={3} borderBottomWidth={1} borderColor="blue.100" bg="blue.100">
                <Text fontWeight="bold" fontSize="md" color="blue.800" letterSpacing="wider">
                  PDF & Knowledgebase Chat
                </Text>
              </Box>
              <Box flex="1" overflowY="auto" minH={0}>
                <DocQaPanel />
              </Box>
            </Box>
            {/* Splitter */}
            {!isStacked && (
              <Box
                width="10px"
                cursor="col-resize"
                bg="gray.100"
                transition="background 0.2s"
                _hover={{ bg: "blue.200" }}
                onMouseDown={startDrag}
                zIndex={3}
                display="flex"
                alignItems="center"
                justifyContent="center"
                role="separator"
                aria-orientation="vertical"
                tabIndex={0}
                h="100%"
              >
                <Box width="4px" height="36px" borderRadius="xl" bg="gray.400" opacity={0.5} />
              </Box>
            )}
            {/* Chat Panel */}
            <Box
              flex="1"
              minW="240px"
              maxW="100%"
              bg="white"
              borderRadius={isStacked ? "none" : "2xl"}
              boxShadow="md"
              display="flex"
              flexDirection="column"
              h="100%"
              position="relative"
            >
              <Box px={4} py={3} borderBottomWidth={1} borderColor="gray.100" bg="gray.100">
                <Text fontWeight="bold" fontSize="md" color="gray.700" letterSpacing="wider">
                  Chat
                </Text>
              </Box>
              <Box flex="1" minH={0} display="flex" flexDirection="column" position="relative">
                {/* Chat history */}
                <Box flex="1" minH={0} overflowY="auto">
                  <ChatWindow />
                </Box>
                {/* Sticky Chat Input */}
                <Box
                  position="sticky"
                  bottom={0}
                  zIndex={1}
                  bg="white"
                  borderTopWidth={1}
                  borderColor="gray.100"
                  px={4}
                  py={2}
                >
                  <ChatInput />
                </Box>
              </Box>
            </Box>
          </HStack>
        </Box>
        <AppFooter />
      </Box>
    </ChatProvider>
  );
}
