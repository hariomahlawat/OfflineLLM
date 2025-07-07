import { useState } from "react";
import { Input, IconButton, HStack, useColorModeValue } from "@chakra-ui/react";
import { ArrowRightIcon } from "@chakra-ui/icons";
import { useChat } from "../../contexts/ChatContext";

export default function ChatInput() {
  const { sendMessage } = useChat();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const onSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await sendMessage(text.trim());
    setText("");
    setSending(false);
  };

  return (
    <HStack spacing={2} pt={2}>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your message…"
        onKeyDown={(e) => e.key === "Enter" && onSend()}
        borderRadius="xl"
        bg={useColorModeValue("gray.50", "gray.700")}
        size="lg"
        boxShadow="sm"
        flex={1}
        isDisabled={sending}
      />
      <IconButton
        aria-label="Send"
        icon={<ArrowRightIcon />}
        colorScheme="blue"
        borderRadius="full"
        size="lg"
        onClick={onSend}
        isDisabled={sending || !text.trim()}
        boxShadow="md"
      />
    </HStack>
  );
}
