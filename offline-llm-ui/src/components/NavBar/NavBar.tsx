import { VStack, IconButton, Tooltip, HStack, Text, Image } from "@chakra-ui/react";
import { ChatIcon } from "@chakra-ui/icons";

export type NavMode = "chat" | "kb" | "pdf" | "grammar" | "rewrite";

interface NavBarProps {
  active: NavMode;
  onChange: (m: NavMode) => void;
}

export function NavBar({ active, onChange }: NavBarProps) {
  return (
    <VStack
      spacing={2}
      py={2}
      px={1}
      bg="bg.muted"
      borderRightWidth={1}
      borderColor="border.default"
      w="120px"
    >
      <Tooltip label="Chat" placement="right">
        <HStack w="full" justify="flex-start">
          <IconButton
            aria-label="Chat"
            icon={<ChatIcon />}
            variant={active === "chat" ? "solid" : "ghost"}
            colorScheme="brand"
            onClick={() => onChange("chat")}
            isRound
          />
          {active === "chat" && (
            <Text fontSize="sm" ml={2} whiteSpace="nowrap">
              Chat
            </Text>
          )}
        </HStack>
      </Tooltip>
      <Tooltip label="Knowledge Base" placement="right">
        <HStack w="full" justify="flex-start">
          <IconButton
            aria-label="Knowledge Base"
            icon={<Image src="/rag.png" boxSize="1.2em" alt="RAG" />}
            variant={active === "kb" ? "solid" : "ghost"}
            colorScheme="brand"
            onClick={() => onChange("kb")}
            isRound
          />
          {active === "kb" && (
            <Text fontSize="sm" ml={2} whiteSpace="nowrap">
              Knowledge
            </Text>
          )}
        </HStack>
      </Tooltip>
      <Tooltip label="Talk to PDF" placement="right">
        <HStack w="full" justify="flex-start">
          <IconButton
            aria-label="Talk to PDF"
            icon={<Image src="/pdf-icon.png" boxSize="1.2em" alt="PDF" />}
            variant={active === "pdf" ? "solid" : "ghost"}
            colorScheme="brand"
            onClick={() => onChange("pdf")}
            isRound
          />
          {active === "pdf" && (
            <Text fontSize="sm" ml={2} whiteSpace="nowrap">
              PDF
            </Text>
          )}
        </HStack>
      </Tooltip>
      <Tooltip label="Grammar" placement="right">
        <HStack w="full" justify="flex-start">
          <IconButton
            aria-label="Grammar check"
            icon={<Image src="/grammarly.png" boxSize="1.2em" alt="Grammar" />}
            variant={active === "grammar" ? "solid" : "ghost"}
            colorScheme="brand"
            onClick={() => onChange("grammar")}
            isRound
          />
          {active === "grammar" && (
            <Text fontSize="sm" ml={2} whiteSpace="nowrap">
              Grammar
            </Text>
          )}
        </HStack>
      </Tooltip>
      <Tooltip label="Rewrite" placement="right">
        <HStack w="full" justify="flex-start">
          <IconButton
            aria-label="Rewrite"
            icon={<Image src="/redraft.png" boxSize="1.2em" alt="Redraft" />}
            variant={active === "rewrite" ? "solid" : "ghost"}
            colorScheme="brand"
            onClick={() => onChange("rewrite")}
            isRound
          />
          {active === "rewrite" && (
            <Text fontSize="sm" ml={2} whiteSpace="nowrap">
              Rewrite
            </Text>
          )}
        </HStack>
      </Tooltip>
    </VStack>
  );
}
