// src/App.tsx

import { useState } from "react";
import { Box, Text, useBreakpointValue } from "@chakra-ui/react";
import { ChatProvider } from "./contexts/ChatContext";
import { AppHeader } from "./components/AppHeader/AppHeader";
import { DocQaPanel } from "./components/DocQaPanel/DocQaPanel";
import { ChatWindow } from "./components/ChatWindow/ChatWindow";
import ChatInput from "./components/ChatInput/ChatInput";
import { AppFooter } from "./components/AppFooter/AppFooter";

export default function App() {
  const [leftPct, setLeftPct] = useState(40);
  const isStacked = useBreakpointValue({ base: true, md: false });

  function startDrag(e: React.MouseEvent) {
    if (isStacked) return;
    e.preventDefault();
    document.body.style.cursor = "col-resize";

    function onMouseMove(ev: MouseEvent) {
      const pct = (ev.clientX / window.innerWidth) * 100;
      setLeftPct(Math.max(18, Math.min(82, pct)));
    }
    function onMouseUp() {
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  return (
    <ChatProvider>
      <Box minH="100vh" w="100vw" display="flex" flexDirection="column">
        {/* HEADER */}
        <Box as="header" position="sticky" top={0} zIndex={100} flexShrink={0}>
          <AppHeader />
        </Box>

        {/* MAIN PANELS */}
        <Box flex="1" minH={0} display="flex" overflow="hidden">
          
          {/* LEFT PANE */}
          <Box
            flex={`0 0 ${leftPct}%`}
            minW="240px"
            maxW="82vw"
            display="flex"
            flexDirection="column"
            minH={0}
            overflow="hidden"
            bg="blue.50"
            borderRightWidth={isStacked ? 0 : 1}
            borderColor="blue.200"
            boxShadow="md"
          >
            <Box
              px={4}
              py={3}
              bg="blue.100"
              flexShrink={0}
              borderBottom="1px solid"
              borderColor="blue.100"
            >
              <Text fontWeight="bold" color="blue.800">
                PDF & Knowledgebase Query
              </Text>
            </Box>
            <Box flex="1" minH={0} overflowY="auto">
              <DocQaPanel />
            </Box>
          </Box>

          {/* GUTTER */}
          {!isStacked && (
            <Box
              w="8px"
              cursor="col-resize"
              onMouseDown={startDrag}
              userSelect="none"
              bg="gray.200"
              _hover={{ bg: "gray.300" }}
            />
          )}

          {/* RIGHT PANE */}
          <Box
            flex="1"
            minW="240px"
            display="flex"
            flexDirection="column"
            minH={0}
            overflow="hidden"
            bg="white"
          >
            <Box
              px={4}
              py={3}
              bg="gray.100"
              flexShrink={0}
              borderBottom="1px solid"
              borderColor="gray.100"
            >
              <Text fontWeight="bold" color="gray.700">
                Chat
              </Text>
            </Box>
            <Box flex="1" minH={0} overflowY="auto">
              <ChatWindow />
            </Box>
            <Box
              position="sticky"
              bottom={0}
              bg="white"
              borderTop="1px solid"
              borderColor="gray.100"
              px={4}
              py={2}
            >
              <ChatInput />
            </Box>
          </Box>
        </Box>

        {/* FOOTER */}
        <Box as="footer" position="sticky" bottom={0} flexShrink={0}>
          <AppFooter />
        </Box>
      </Box>
    </ChatProvider>
  );
}
