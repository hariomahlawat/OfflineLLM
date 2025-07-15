// src/App.tsx

import { useState } from "react";
import { Box } from "@chakra-ui/react";
import { ChatProvider } from "./contexts/ChatContext";
import { AppHeader } from "./components/AppHeader/AppHeader";
import { KnowledgeBasePanel } from "./components/KnowledgeBasePanel/KnowledgeBasePanel";
import { PdfSessionPanel } from "./components/PdfSessionPanel/PdfSessionPanel";
import { GrammarPanel } from "./components/GrammarPanel/GrammarPanel";
import { ChatWindow } from "./components/ChatWindow/ChatWindow";
import ChatInput from "./components/ChatInput/ChatInput";
import { RewritePanel } from "./components/RewritePanel/RewritePanel";
import { AppFooter } from "./components/AppFooter/AppFooter";
import { NavBar, type NavMode } from "./components/NavBar/NavBar";

export default function App() {
  const [mode, setMode] = useState<NavMode>("chat");

  return (
    <ChatProvider>
      <Box h="100vh" w="100vw" display="flex" flexDirection="column" overflow="hidden">
        {/* HEADER */}
        <Box as="header" position="sticky" top={0} zIndex={100} flexShrink={0}>
          <AppHeader />
        </Box>

        {/* MAIN AREA */}
        <Box flex="1" minH={0} display="flex" overflow="hidden">
          <NavBar active={mode} onChange={setMode} />
          <Box flex="1" display="flex" flexDirection="column" bg="brand.surface">
            <Box display={mode === "chat" ? "flex" : "none"} flexDirection="column" flex="1" minH={0}>
              <Box flex="1" minH={0} overflowY="auto">
                <ChatWindow />
              </Box>
              <Box
                position="sticky"
                bottom={0}
                zIndex={100}
                bg="brand.surface"
                borderTop="1px solid"
                borderColor="border.default"
                px={4}
                py={2}
              >
                <ChatInput />
              </Box>
            </Box>
            <Box display={mode === "kb" ? "block" : "none"} flex="1" minH={0}>
              <KnowledgeBasePanel />
            </Box>
            <Box display={mode === "pdf" ? "block" : "none"} flex="1" minH={0}>
              <PdfSessionPanel />
            </Box>
            <Box display={mode === "grammar" ? "block" : "none"} flex="1" minH={0}>
              <GrammarPanel />
            </Box>
            <Box display={mode === "rewrite" ? "block" : "none"} flex="1" minH={0}>
              <RewritePanel />
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
