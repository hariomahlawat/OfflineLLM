// src/App.tsx

import { useState } from "react";
import {
  Box,
  Text,
  IconButton,
  useBreakpointValue,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { ChatProvider } from "./contexts/ChatContext";
import { AppHeader } from "./components/AppHeader/AppHeader";
import { DocQaPanel } from "./components/DocQaPanel/DocQaPanel";
import { ChatWindow } from "./components/ChatWindow/ChatWindow";
import ChatInput from "./components/ChatInput/ChatInput";
import { AppFooter } from "./components/AppFooter/AppFooter";

export default function App() {
  const [leftPct, setLeftPct] = useState(40);
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const isStacked = useBreakpointValue({ base: true, md: false });

  function startDrag(e: React.MouseEvent) {
    if (isStacked || !showLeft || !showRight) return;
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
        <Box flex="1" minH={0} display="flex" overflow="hidden" position="relative">

          {/* Restore Left Button */}
          {!showLeft && (
            <Box position="absolute" left={0} top={0} bottom={0} w={0}>
              <Box
                position="absolute"
                left={0}
                top="50%"
                transform="translateY(-50%)"
                w="20px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="bg.muted"
                borderRightWidth={1}
                borderColor="border.default"
                zIndex={1}
              >
                <IconButton
                  aria-label="Show left panel"
                  size="xs"
                  variant="ghost"
                  icon={<ChevronRightIcon />}
                  onClick={() => setShowLeft(true)}
                />
              </Box>
            </Box>
          )}

          {/* LEFT PANE */}
          {showLeft && (
            <Box
              flex={showRight ? `0 0 ${leftPct}%` : '1'}
              minW="240px"
              maxW="82vw"
              display="flex"
              flexDirection="column"
              minH={0}
              overflow="hidden"
              bg="bg.surface"
              borderRightWidth={isStacked || !showRight ? 0 : 1}
              borderColor="border.default"
              boxShadow="md"
            >
              <Box
                px={5}
                py={0}
                bg="bg.muted"
                flexShrink={0}
                borderBottom="1px solid"
                borderColor="border.default"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Text fontWeight="bold" color="brand.primary">
                  PDF & Knowledgebase Query
                </Text>
                <IconButton
                  aria-label="Hide left panel"
                  icon={<ChevronLeftIcon />}
                  size="xs"
                  variant="ghost"
                  onClick={() => setShowLeft(false)}
                />
              </Box>
              <Box flex="1" minH={0} overflowY="auto">
                <DocQaPanel />
              </Box>
            </Box>
          )}

          {/* GUTTER */}
          {showLeft && showRight && !isStacked && (
            <Box
              w="4px"
              cursor="col-resize"
              onMouseDown={startDrag}
              userSelect="none"
              bg="border.default"
              _hover={{ bg: 'gray.300' }}
            />
          )}

          {/* RIGHT PANE */}
          {showRight && (
            <Box
              flex={showLeft ? '1' : '1 0 100%'}
              minW="240px"
              display="flex"
              flexDirection="column"
              minH={0}
              overflow="hidden"
              bg="brand.surface"
            >
              <Box
                px={5}
                py={0}
                bg="bg.muted"
                flexShrink={0}
                borderBottom="1px solid"
                borderColor="border.default"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Text fontWeight="bold" color="brand.primary">
                  Chat
                </Text>
                <IconButton
                  aria-label="Hide right panel"
                  icon={<ChevronRightIcon />}
                  size="xs"
                  variant="ghost"
                  onClick={() => setShowRight(false)}
                />
              </Box>

              <Box flex="1" minH={0} overflowY="auto">
                <ChatWindow />
              </Box>

              <Box
                position="sticky"
                zIndex={100} flexShrink={0}
                bottom={0}
                bg="brand.surface"
                borderTop="1px solid"
                borderColor="border.default"
                px={4}
                py={2}
              >
                <ChatInput />
              </Box>

            </Box>
          )}

          {/* Restore Right Button */}
          {!showRight && (
            <Box position="absolute" right={0} top={0} bottom={0} w={0}>
              <Box
                position="absolute"
                right={0}
                top="50%"
                transform="translateY(-50%)"
                w="20px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="bg.muted"
                borderLeftWidth={1}
                borderColor="border.default"
                zIndex={1}
              >
                <IconButton
                  aria-label="Show right panel"
                  size="xs"
                  variant="ghost"
                  icon={<ChevronLeftIcon />}
                  onClick={() => setShowRight(true)}
                />
              </Box>
            </Box>
          )}
        </Box>

        {/* FOOTER */}
        <Box as="footer" position="sticky" bottom={0} flexShrink={0}>
          <AppFooter />
        </Box>
      </Box>
    </ChatProvider>
  );
}
