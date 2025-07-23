import { useState } from "react";
import {
  Box,
  Text,
  Collapse,
  useColorModeValue,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";
import ReactMarkdown from "react-markdown";
import { parseThink } from "../../utils/parseThink";

interface Props {
  text: unknown;
  color: string;
}

export function AssistantBubble({ text, color }: Props) {
  const { visible, think } = parseThink(text);
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const gray = useColorModeValue("gray.600", "gray.400");

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(visible);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      /* ignore */
    }
  };

  return (
    <Box fontSize="sm" color={color} position="relative"
      sx={{
        ul: { pl: 4, mb: 2 },
        ol: { pl: 4, mb: 2 },
        li: { mb: 1 },
        strong: { fontWeight: 700 },
        code: {
          bg: useColorModeValue("#f5f5f5", "#333"),
          px: 1,
          borderRadius: "sm",
          fontSize: "0.97em",
        },
        pre: {
          bg: useColorModeValue("#f5f5f5", "#333"),
          borderRadius: "md",
          p: 2,
          mb: 2,
          fontSize: "0.97em",
          overflowX: "auto",
        },
        h1: { fontSize: "lg", mb: 1, mt: 1 },
        h2: { fontSize: "md", mb: 1, mt: 1 },
        h3: { fontSize: "sm", mb: 1, mt: 1 },
        a: { color: "blue.500", textDecoration: "underline" },
        p: { mb: 2 },
      }}
    >
      <Tooltip label={copied ? "Copied" : "Copy"} openDelay={300}>
        <IconButton
          aria-label="Copy answer"
          icon={<CopyIcon />}
          size="sm"
          variant="ghost"
          position="absolute"
          top={-7}
          right={-2}
          onClick={onCopy}
        />
      </Tooltip>
      {think && (
        <>
          <Text
            as="button"
            fontSize="xs"
            color={gray}
            _hover={{ textDecoration: "underline" }}
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide thoughts" : "Show thoughts"}
          >
            {show ? "Hide Thoughts" : "Show Thoughts"}
          </Text>
          <Collapse in={show} animateOpacity>
            <Box mt={1} fontSize="xs" color={gray}>
              <ReactMarkdown>{think}</ReactMarkdown>
            </Box>
          </Collapse>
        </>
      )}
      <ReactMarkdown>{visible}</ReactMarkdown>
    </Box>
  );
}