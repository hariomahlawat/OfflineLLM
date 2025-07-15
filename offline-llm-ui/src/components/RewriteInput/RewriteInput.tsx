import { useState } from "react";
import { Textarea, IconButton, HStack } from "@chakra-ui/react";
import { ArrowRightIcon } from "@chakra-ui/icons";
import { useRewrite } from "../../contexts/RewriteContext";
import { SpeechButton } from "../SpeechButton";

export default function RewriteInput() {
  const { sendMessage, sending } = useRewrite();
  const [text, setText] = useState("");

  const onSend = async () => {
    if (!text.trim() || sending) return;
    await sendMessage(text.trim());
    setText("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && text.trim() && !sending) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <HStack spacing={2} px={2} pb={2} align="end" position="sticky" bottom={0} zIndex={10}>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste text…"
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
      <SpeechButton onResult={(t) => setText((p) => p + (p ? ' ' : '') + t)} />
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
