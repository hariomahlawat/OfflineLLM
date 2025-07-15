// src/App.tsx

import { useState } from "react";
import { Box } from "@chakra-ui/react";
import { ChatProvider } from "./contexts/ChatContext";
import { RewriteProvider } from "./contexts/RewriteContext";
import { AppHeader } from "./components/AppHeader/AppHeader";
import { KnowledgeBasePanel } from "./components/KnowledgeBasePanel/KnowledgeBasePanel";
import { PdfSessionPanel } from "./components/PdfSessionPanel/PdfSessionPanel";
import { GrammarPanel } from "./components/GrammarPanel/GrammarPanel";
import { ChatWindow } from "./components/ChatWindow/ChatWindow";
import ChatInput from "./components/ChatInput/ChatInput";
import { RewriteWindow } from "./components/RewriteWindow/RewriteWindow";
import RewriteInput from "./components/RewriteInput/RewriteInput";
import { AppFooter } from "./components/AppFooter/AppFooter";
import { NavBar, type NavMode } from "./components/NavBar/NavBar";

export default function App() {
  const [mode, setMode] = useState<NavMode>("chat");

  return (
    <ChatProvider>
      <RewriteProvider>
      <Box h="100vh" w="100vw" display="flex" flexDirection="column" overflow="hidden">
        {/* HEADER */}
        <Box as="header" position="sticky" top={0} zIndex={100} flexShrink={0}>
          <AppHeader />
        </Box>

        {/* MAIN AREA */}
        <Box flex="1" minH={0} display="flex" overflow="hidden">
          <NavBar active={mode} onChange={setMode} />
          <Box flex="1" display="flex" flexDirection="column" bg="brand.surface">
            {mode === "chat" && (
              <>
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
              </>
            )}
            {mode === "kb" && <KnowledgeBasePanel />}
            {mode === "pdf" && <PdfSessionPanel />}
            {mode === "grammar" && <GrammarPanel />}
            {mode === "rewrite" && (
              <>
                <Box flex="1" minH={0} overflowY="auto">
                  <RewriteWindow />
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
                  <RewriteInput />
                </Box>
              </>
            )}
          </Box>
        </Box>

        {/* FOOTER */}
        <Box as="footer" position="sticky" bottom={0} flexShrink={0}>
          <AppFooter />
        </Box>
      </Box>
      </RewriteProvider>
    </ChatProvider>
  );
}
