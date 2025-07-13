import { useState } from "react";
import { Box, Text, Collapse, useColorModeValue } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import { parseThink } from "../../utils/parseThink";

interface Props {
  text: string;
  color: string;
}

export function AssistantBubble({ text, color }: Props) {
  const { answer, think } = parseThink(text);
  const [show, setShow] = useState(false);
  const gray = useColorModeValue("gray.600", "gray.400");

  return (
    <Box fontSize="sm" color={color}
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
      <ReactMarkdown>{answer}</ReactMarkdown>
    </Box>
  );
}