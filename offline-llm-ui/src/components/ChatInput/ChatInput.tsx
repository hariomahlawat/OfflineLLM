import { useState } from "react";
import { Textarea, IconButton, HStack, useColorModeValue } from "@chakra-ui/react";
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
    <HStack spacing={2} px={2} pb={2} align="end">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your message…"
        onKeyDown={onKeyDown}
        borderRadius="xl"
        bg={useColorModeValue("gray.50", "gray.700")}
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
        colorScheme="blue"
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
