// File: src/components/ChatInput/ChatInput.tsx
// This file is part of the Offline LLM UI project.

import { useState } from "react";
import { Textarea, IconButton, HStack, useColorModeValue } from "@chakra-ui/react";
import { ArrowRightIcon } from "@chakra-ui/icons";
import { useChat } from "../../contexts/ChatContext";

export default function ChatInput() {
  const { sendMessage, sending, model } = useChat(); // include model state
  const [text, setText] = useState("");

  const onSend = async () => {
    if (!text.trim() || sending || !model) return;
    await sendMessage(text.trim());
    setText("");
  };

  // Enter to send, Shift+Enter for newline
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && text.trim() && !sending && model) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <HStack spacing={2} px={2} pb={2} align="end"  position="sticky" bottom={0} zIndex={10}>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={model ? "Type your message…" : "Select a model first"}
        onKeyDown={onKeyDown}
        borderRadius="xl"
        bg={useColorModeValue("gray.50", "gray.700")}
        size="sm"
        boxShadow="sm"
        flex={1}
        isDisabled={sending || !model}
        fontSize="sm"
        minH="80px"
        maxH="120px"
        resize="vertical"
      />
      <IconButton
        aria-label="Send"
        icon={<ArrowRightIcon />}
        colorScheme="blue"
        borderRadius="full"
        size="md"
        onClick={onSend}
        isDisabled={sending || !text.trim() || !model}
        boxShadow="md"
        alignSelf="end"
      />
    </HStack>
  );
}
