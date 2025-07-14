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
        <Box flex="1" minH={0} display="flex" overflow="hidden">

          {/* Restore Left Button */}
          {!showLeft && (
            <Box
              w="20px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="bg.muted"
              borderRightWidth={1}
              borderColor="border.default"
            >
              <IconButton
                aria-label="Show left panel"
                size="xs"
                variant="ghost"
                icon={<ChevronRightIcon />}
                onClick={() => setShowLeft(true)}
              />
            </Box>
          )}

          {/* LEFT PANE */}
          <Box
            transition="width 0.2s ease"
            width={showLeft ? (showRight ? `${leftPct}%` : '100%') : '0%'}
            flex={showLeft ? (showRight ? '0 0 auto' : '1') : '0 0 0%'}
            minW={showLeft ? '240px' : '0'}
            maxW="82vw"
            display="flex"
            flexDirection="column"
            minH={0}
            overflow="hidden"
            bg="bg.surface"
            borderRightWidth={isStacked || !showRight ? 0 : 1}
            borderColor="border.default"
            boxShadow="md"
            visibility={showLeft ? 'visible' : 'hidden'}
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
          <Box
            transition="width 0.2s ease"
            width={showRight ? (showLeft ? `calc(${100 - leftPct}% - ${showLeft && showRight && !isStacked ? 4 : 0}px)` : '100%') : '0%'}
            flex={showRight ? '1' : '0 0 0%'}
            minW={showRight ? '240px' : '0'}
            display="flex"
            flexDirection="column"
            minH={0}
            overflow="hidden"
            bg="brand.surface"
            visibility={showRight ? 'visible' : 'hidden'}
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

          {/* Restore Right Button */}
          {!showRight && (
            <Box
              w="20px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="bg.muted"
              borderLeftWidth={1}
              borderColor="border.default"
            >
              <IconButton
                aria-label="Show right panel"
                size="xs"
                variant="ghost"
                icon={<ChevronLeftIcon />}
                onClick={() => setShowRight(true)}
              />
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
