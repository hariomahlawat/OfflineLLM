import { useState } from "react";
import { Box, Textarea, IconButton, HStack, Spinner, Text } from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { redraftText } from "../../api";

export function RewritePanel() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [checking, setChecking] = useState(false);

  const onCheck = async () => {
    if (!input.trim()) return;
    setChecking(true);
    try {
      const { corrected } = await redraftText(input.trim());
      setResult(corrected);
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    } finally {
      setChecking(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && input.trim() && !checking) {
      e.preventDefault();
      onCheck();
    }
  };

  return (
    <Box flex="1" display="flex" flexDirection="column" p={2} gap={2} bg="brand.surface">
      <Text fontSize="sm" color="text.muted">
        Paste your text here for re-drafting
      </Text>
      <Textarea
        placeholder="Paste text to rewrite…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        size="sm"
        borderRadius="xl"
        bg="bg.muted"
        minH="120px"
        maxH="160px"
        resize="vertical"
        isDisabled={checking}
      />
      <HStack justify="flex-end">
        <IconButton
          aria-label="Rewrite text"
          icon={checking ? <Spinner size="sm" /> : <CheckIcon />}
          colorScheme="brand"
          borderRadius="full"
          size="md"
          onClick={onCheck}
          isDisabled={checking || !input.trim()}
        />
      </HStack>
      {result && (
        <Box bg="bg.muted" borderRadius="xl" p={3} mt={2} whiteSpace="pre-wrap" fontSize="sm">
          <Text>{result}</Text>
        </Box>
      )}
    </Box>
  );
}
