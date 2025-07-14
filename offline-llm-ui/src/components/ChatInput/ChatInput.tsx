// File: src/components/ChatInput/ChatInput.tsx
// This file is part of the Offline LLM UI project.

import { useState } from "react";
import { FOOTER_HEIGHT } from "../../constants";
import { Textarea, IconButton, HStack } from "@chakra-ui/react";
import { ArrowRightIcon } from "@chakra-ui/icons";
import { useChat } from "../../contexts/ChatContext";

export default function ChatInput() {
  const { sendMessage, sending } = useChat(); // Use context sending!
  const [text, setText] = useState("");

  const onSend = async () => {
    if (!text.trim() || sending) return;
    await sendMessage(text.trim());
    setText("");
  };

  // Enter to send, Shift+Enter for newline
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && text.trim() && !sending) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <HStack
      spacing={2}
      px={2}
      py={2}
      align="end"
      position="sticky"
      bottom={FOOTER_HEIGHT}
      bg="brand.surface"
      borderTop="1px solid"
      borderColor="border.default"
      zIndex={10}
    >
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your message…"
        onKeyDown={onKeyDown}
        borderRadius="xl"
        bg="bg.muted"
        size="sm"
        boxShadow="sm"
        flex={1}
        isDisabled={sending}
        fontSize="sm"
        minH="80px"
        maxH="120px"
        resize="vertical"
      />
      <IconButton
        aria-label="Send"
        icon={<ArrowRightIcon />}
        colorScheme="brand"
        borderRadius="full"
        size="md"
        onClick={onSend}
        isDisabled={sending || !text.trim()}
        boxShadow="md"
        alignSelf="end"
      />
    </HStack>
  );
}
