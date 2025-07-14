// src/App.tsx

import { useState, useEffect } from "react";
import {
  Box,
  Text,
  IconButton,
  Tooltip,
  useBreakpointValue,
  Collapse,
  HStack,
} from "@chakra-ui/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  RepeatIcon,
} from "@chakra-ui/icons";
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

  // guard so both can't be hidden
  useEffect(() => {
    if (!showLeft && !showRight) setShowRight(true);
  }, [showLeft, showRight]);

  // drag gutter
  function startDrag(e: React.MouseEvent) {
    if (isStacked || !showLeft || !showRight) return;
    e.preventDefault();
    document.body.style.cursor = "ew-resize";
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

  const gutter = showLeft && showRight && !isStacked ? 4 : 0;
  const leftWidth = showLeft
    ? showRight
      ? `${leftPct}%`
      : `calc(100% - ${gutter}px)`
    : `0px`;
  const rightWidth = showRight
    ? showLeft
      ? `calc(${100 - leftPct}% - ${gutter}px)`
      : `calc(100% - ${gutter}px)`
    : `0px`;

  return (
    <ChatProvider>
      <Box h="100vh" w="100vw" display="flex" flexDirection="column">
        {/* HEADER with Reset Layout */}
        <Box as="header" position="sticky" top={0} zIndex={100}>
          <HStack px={4} py={2} bg="bg.muted" justify="space-between">
            <AppHeader />
            <Tooltip label="Reset split to show both panels">
              <IconButton
                aria-label="Reset layout"
                icon={<RepeatIcon />}
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowLeft(true);
                  setShowRight(true);
                  setLeftPct(40);
                }}
              />
            </Tooltip>
          </HStack>
        </Box>

        {/* MAIN */}
        <Box flex="1" display="flex" overflow="hidden" minH={0}>
          {/* Left-side restore button (always visible when left hidden) */}
          {!showLeft && (
            <Box
              w="24px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="bg.muted"
              borderRight="1px solid"
              borderColor="border.default"
              zIndex={10}
            >
              <Tooltip label="Show left panel">
                <IconButton
                  aria-label="Show left panel"
                  icon={
                    <ChevronRightIcon
                      boxSize={5}
                      fontWeight="bold"
                    />
                  }
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLeft(true)}
                />
              </Tooltip>
            </Box>
          )}

          {/* LEFT PANEL */}
          <Box
            width={leftWidth}
            minW="0"
            transition="width 0.25s ease"
            display="flex"
            flexDirection="column"
            borderRight={gutter ? "1px solid" : undefined}
            borderColor="border.default"
          >
            {/* header always rendered so toggle available */}
            <Box
              px={5}
              py={2}
              bg="bg.muted"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              borderBottom="1px solid"
              borderColor="border.default"
            >
              <Text fontWeight="bold" color="brand.primary">
                PDF & Knowledgebase Query
              </Text>
              <Tooltip label={showLeft ? "Hide panel" : "Show panel"}>
                <IconButton
                  aria-label="Toggle left panel"
                  icon={
                    <ChevronLeftIcon
                      boxSize={5}
                      fontWeight="bold"
                      transform={showLeft ? "rotate(0deg)" : "rotate(180deg)"}
                      transition="transform 0.2s"
                    />
                  }
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLeft(!showLeft)}
                />
              </Tooltip>
            </Box>

            {/* content fades */}
            <Collapse in={showLeft} animateOpacity>
              <Box flex="1" overflowY="auto">
                <DocQaPanel />
              </Box>
            </Collapse>
          </Box>

          {/* GUTTER */}
          {gutter > 0 && (
            <Box
              w="4px"
              _hover={{ w: "8px", bg: "border.default" }}
              cursor="ew-resize"
              onMouseDown={startDrag}
              transition="width 0.1s"
            />
          )}

          {/* RIGHT-side restore button */}
          {!showRight && (
            <Box
              w="24px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="bg.muted"
              borderLeft="1px solid"
              borderColor="border.default"
              zIndex={10}
            >
              <Tooltip label="Show right panel">
                <IconButton
                  aria-label="Show right panel"
                  icon={
                    <ChevronLeftIcon
                      boxSize={5}
                      fontWeight="bold"
                      transform="rotate(180deg)"
                    />
                  }
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRight(true)}
                />
              </Tooltip>
            </Box>
          )}

          {/* RIGHT PANEL */}
          <Box
            width={rightWidth}
            minW="0"
            transition="width 0.25s ease"
            display="flex"
            flexDirection="column"
            borderLeft={gutter ? "1px solid" : undefined}
            borderColor="border.default"
          >
            {/* header always rendered */}
            <Box
              px={5}
              py={2}
              bg="bg.muted"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              borderBottom="1px solid"
              borderColor="border.default"
            >
              <Text fontWeight="bold" color="brand.primary">
                Chat
              </Text>
              <Tooltip label={showRight ? "Hide panel" : "Show panel"}>
                <IconButton
                  aria-label="Toggle right panel"
                  icon={
                    <ChevronRightIcon
                      boxSize={5}
                      fontWeight="bold"
                      transform={showRight ? "rotate(0deg)" : "rotate(180deg)"}
                      transition="transform 0.2s"
                    />
                  }
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRight(!showRight)}
                />
              </Tooltip>
            </Box>

            {/* message list */}
            <Collapse in={showRight} animateOpacity>
              <Box flex="1" overflowY="auto">
                <ChatWindow />
              </Box>
            </Collapse>

            {/* pinned chat input */}
            {showRight && (
              <Box
                flexShrink={0}
                bg="brand.surface"
                borderTop="1px solid"
                borderColor="border.default"
                px={4}
                py={2}
                zIndex={1}
              >
                <ChatInput />
              </Box>
            )}
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
