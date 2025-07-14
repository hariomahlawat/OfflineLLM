// src/components/ChatWindow/ChatWindow.tsx

import {
  Box,
  HStack,
  Text,
  Avatar,
  Spinner,
} from "@chakra-ui/react";
import { useChat } from "../../contexts/ChatContext";
import { useRef, useEffect } from "react";
import { AssistantBubble } from "../AssistantBubble/AssistantBubble";

export function ChatWindow() {
  const { messages, sending } = useChat();
  const userBg = 'brand.primary';
  const userText = 'white';
  const aiBg = 'bg.muted';
  const aiText = 'text.primary';

  // Auto-scroll whenever messages list or sending state changes
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      flex="1"
      minH={0}
      overflowY="auto"
      px={2}
      py={2}
      borderRadius="xl"
      bg="brand.surface"
      position="relative"
      sx={{
        "&::before": {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/sdd.png')",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'contain',
          opacity: 0.05,
          pointerEvents: 'none',
          zIndex: -1,
        },
      }}
    >
      {messages.length === 0 && !sending ? (
        <Box flex="1" display="flex" alignItems="center" justifyContent="center" minH={300}>
          <Text color="text.muted" fontSize="lg" fontWeight="medium" textAlign="center">
            No messages yet. Ask anything to start a conversation!
          </Text>
        </Box>
      ) : (
        <>
          {messages.map((m, i) => (
            <HStack
              key={i}
              justify={m.from === "user" ? "flex-end" : "flex-start"}
              mb={1.5}
              spacing={2}
              align="start"
            >
              {m.from !== "user" && (
                <Avatar
                  size="xs"
                  name="AI"
                  bg="brand.accent"
                  color="white"
                  icon={<span style={{ fontSize: 18 }}>🤖</span>}
                />
              )}

              <Box
                bg={m.from === "user" ? userBg : aiBg}
                color={m.from === "user" ? userText : aiText}
                px={4}
                py={2}
                borderRadius="2xl"
                maxW="70%"
                boxShadow={m.from === "user" ? "md" : "sm"}
              >
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  opacity={0.8}
                  mb={1}
                  color={m.from === "user" ? "white" : "brand.accent"}
                >
                  {m.from === "user" ? "You" : "AI"}
                </Text>

                {m.from === "assistant" ? (
                  <AssistantBubble text={m.text} color={aiText} />
                ) : (
                  <Text fontSize="sm" wordBreak="break-word">
                    {m.text}
                  </Text>
                )}
              </Box>

              {m.from === "user" && (
                <Avatar
                  size="xs"
                  name="You"
                  bg="brand.primary"
                  color="white"
                  icon={<span style={{ fontSize: 18 }}>🧑</span>}
                />
              )}
            </HStack>
          ))}

          {/* Show spinner row while waiting for AI */}
          {sending && (
            <HStack justify="flex-start" mb={1.5} spacing={2}>
              <Avatar
                size="xs"
                name="AI"
                bg="brand.accent"
                color="white"
                icon={<span style={{ fontSize: 18 }}>🤖</span>}
              />
              <Box
                bg={aiBg}
                color={aiText}
                px={4}
                py={2}
                borderRadius="2xl"
                maxW="70%"
                boxShadow="sm"
              >
                <HStack spacing={2}>
                  <Spinner size="sm" color="spinner.color" />
                  <Text fontSize="sm" color="text.muted">
                    Waiting for answer…
                  </Text>
                </HStack>
              </Box>
            </HStack>
          )}
        </>
      )}

      {/* Always scroll to this div */}
      <div ref={endRef} />
    </Box>
  );
}
