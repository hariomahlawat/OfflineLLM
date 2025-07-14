// src/App.tsx

import { useState } from "react";
import {
  Box,
  Text,
  HStack,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  useBreakpointValue,
  useColorModeValue,
} from "@chakra-ui/react";
import { InfoOutlineIcon } from "@chakra-ui/icons";
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
            bg="bg.surface"
            borderRightWidth={isStacked ? 0 : 1}
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
            >
              <HStack spacing={2}>
                <Text fontWeight="bold" color="brand.primary">
                  PDF & Knowledgebase Query
                </Text>
                <Popover placement="right-start">
                  <PopoverTrigger>
                    <Box as="button" aria-label="Info">
                      <InfoOutlineIcon color="text.muted" />
                    </Box>
                  </PopoverTrigger>
                  <PopoverContent w="xs" fontSize="sm">
                    <PopoverBody>
                      Upload a PDF or query the organisation's knowledge base. Self-hosted RAG: PDF ingestion → Chroma vector store → cross-encoder re-rank → Ollama LLM.
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
              </HStack>
            </Box>
            <Box flex="1" minH={0} overflowY="auto">
              <DocQaPanel />
            </Box>
          </Box>

          {/* GUTTER */}
          {!isStacked && (
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
            flex="1"
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
            >
              <HStack spacing={2}>
                <Text fontWeight="bold" color="brand.primary">
                  Chat
                </Text>
                <Tooltip
                  label="Free-form conversation with memory using the selected model."
                  fontSize="sm"
                  placement="right"
                  hasArrow
                >
                  <span>
                    <InfoOutlineIcon color="text.muted" />
                  </span>
                </Tooltip>
              </HStack>
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
        </Box>

        {/* FOOTER */}
        <Box as="footer" position="sticky" bottom={0} flexShrink={0}>
          <AppFooter />
        </Box>
      </Box>
    </ChatProvider>
  );
}
