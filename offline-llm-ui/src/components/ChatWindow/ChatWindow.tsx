// src/components/ChatWindow/ChatWindow.tsx

import {
  Box,
  HStack,
  Text,
  Avatar,
  useColorModeValue,
  Spinner,
} from "@chakra-ui/react";
import { useChat } from "../../contexts/ChatContext";
import { useRef, useEffect } from "react";
import { AssistantBubble } from "../AssistantBubble/AssistantBubble";

export function ChatWindow() {
  const { messages, sending } = useChat();
  const userBg = useColorModeValue("blue.400", "blue.600");
  const userText = "white";
  const aiBg = useColorModeValue("gray.100", "gray.700");
  const aiText = useColorModeValue("gray.900", "white");

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
      bg={useColorModeValue("gray.50", "gray.800")}
    >
      {messages.length === 0 && !sending ? (
        <Box flex="1" display="flex" alignItems="center" justifyContent="center" minH={300}>
          <Text color="gray.400" fontSize="lg" textAlign="center">
            No messages yet. Start a conversation!
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
                  bg="gray.400"
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
                  color={m.from === "user" ? "white" : "blue.700"}
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
                  bg="blue.500"
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
                bg="gray.400"
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
                  <Spinner size="sm" color="blue.500" />
                  <Text fontSize="sm" color="gray.400">
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
