// src/App.tsx

import { useState } from "react";
import { Box, Text, useBreakpointValue, useColorModeValue } from "@chakra-ui/react";
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
      <Box h="100vh" w="100vw" display="flex" flexDirection="column" overflow="hidden">
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
            bg={useColorModeValue("blue.50", "gray.900")}
            borderRightWidth={isStacked ? 0 : 1}
            borderColor={useColorModeValue("blue.200", "blue.700")}
            boxShadow="md"
          >
            <Box
              px={4}
              py={3}
              bg={useColorModeValue("blue.100", "gray.700")}
              flexShrink={0}
              borderBottom="1px solid"
              borderColor={useColorModeValue("blue.100", "gray.700")}
            >
              <Text fontWeight="bold" color={useColorModeValue("blue.800", "blue.200")}>
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
              bg={useColorModeValue("gray.200", "gray.600")}
              _hover={{ bg: useColorModeValue("gray.300", "gray.500") }}
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
            bg={useColorModeValue("white", "gray.800")}
          >
            <Box
              px={4}
              py={3}
              bg={useColorModeValue("gray.100", "gray.700")}
              flexShrink={0}
              borderBottom="1px solid"
              borderColor={useColorModeValue("gray.100", "gray.700")}
            >
              <Text fontWeight="bold" color={useColorModeValue("gray.700", "gray.200")}>
                Chat
              </Text>
            </Box>

            <Box flex="1" minH={0} overflowY="auto">
              <ChatWindow />
            </Box>

            <Box
              position="sticky"
              zIndex={100} flexShrink={0}
              bottom={0}
              bg={useColorModeValue("white", "gray.800")}
              borderTop="1px solid"
              borderColor={useColorModeValue("gray.100", "gray.700")}
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
