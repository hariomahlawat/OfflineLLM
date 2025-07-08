import { useState, useRef } from "react";
import { HStack, Box, useBreakpointValue, Text } from "@chakra-ui/react";
import { ChatProvider } from "./contexts/ChatContext";
import { AppHeader } from "./components/AppHeader/AppHeader";
import { ChatWindow } from "./components/ChatWindow/ChatWindow";
import ChatInput from "./components/ChatInput/ChatInput";
import { DocQaPanel } from "./components/DocQaPanel/DocQaPanel";
import { AppFooter } from "./components/AppFooter/AppFooter";

export default function App() {
  const [leftPercent, setLeftPercent] = useState(40);
  const isStacked = useBreakpointValue({ base: true, md: false });
  const dragging = useRef(false);

  function startDrag(_e: any) {
    if (isStacked) return;
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    function onMove(ev: { clientX: number; }) {
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
      {/* Main App Wrapper */}
      <Box minH="100vh" w="100vw" display="flex" flexDirection="column">
        {/* Sticky Header */}
        <Box as="header" position="sticky" top={0} zIndex={100} flexShrink={0}>
          <AppHeader />
        </Box>
        {/* Main Content Area */}
        <Box
          flex="1"
          minH={0}
          display="flex"
          flexDirection="column"
          overflow="auto"   // <-- this allows the main content to scroll
        >
          <HStack flex="1" minH={0} spacing={0} w="100%" align="stretch" overflow="hidden">
            {/* Left Panel */}
            <Box
              width={isStacked ? "100%" : `${leftPercent}%`}
              minW="240px"
              maxW={isStacked ? "100%" : "82vw"}
              display="flex"
              flexDirection="column"
              overflow="hidden"
              h="100%"
              bg="blue.50"
              borderRightWidth={isStacked ? 0 : 1}
              borderColor="blue.200"
              boxShadow="md"
              position="relative"
            >
              <Box px={4} py={3} borderBottomWidth={1} borderColor="blue.100" bg="blue.100">
                <Text fontWeight="bold" fontSize="sm" color="blue.800" letterSpacing="wider">
                  PDF & Knowledgebase Chat
                </Text>
              </Box>
              <Box flex="1" minH={0} overflowY="auto">
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
                aria-label="Resize panel"
                userSelect="none"
              >
                <Box width="4px" height="36px" borderRadius="xl" bg="gray.400" opacity={0.5} />
              </Box>
            )}
            {/* Right Panel */}
            <Box
              flex="1"
              minW="240px"
              maxW="100%"
              display="flex"
              flexDirection="column"
              overflow="hidden"
              h="100%"
              bg="white"
              borderRadius={isStacked ? "none" : "2xl"}
              boxShadow="md"
              position="relative"
            >
              <Box px={4} py={3} borderBottomWidth={1} borderColor="gray.100" bg="gray.100">
                <Text fontWeight="bold" fontSize="sm" color="gray.700" letterSpacing="wider">
                  Chat
                </Text>
              </Box>
              <Box flex="1" minH={0} display="flex" flexDirection="column" overflow="hidden">
                <Box flex="1" minH={0} overflowY="auto">
                  <ChatWindow />
                </Box>
                <Box
                  position="sticky"
                  bottom={0}
                  bg="white"
                  borderTopWidth={1}
                  borderColor="gray.100"
                  px={4}
                  py={2}
                  zIndex={1}
                >
                  <ChatInput />
                </Box>
              </Box>
            </Box>
          </HStack>
        </Box>
        {/* Sticky Footer */}
        <Box as="footer" position="sticky" bottom={0} zIndex={100} flexShrink={0}>
          <AppFooter />
        </Box>
      </Box>
    </ChatProvider>
  );
}
