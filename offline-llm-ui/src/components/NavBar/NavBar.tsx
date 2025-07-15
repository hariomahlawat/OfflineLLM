import { VStack, IconButton, Tooltip, HStack, Image } from "@chakra-ui/react";
import { ChatIcon } from "@chakra-ui/icons";

export type NavMode = "chat" | "kb" | "pdf" | "grammar" | "rewrite";

interface NavBarProps {
  active: NavMode;
  onChange: (m: NavMode) => void;
}

export function NavBar({ active, onChange }: NavBarProps) {
  return (
    <VStack
      spacing={3}
      py={2}
      px={1}
      bg="bg.muted"
      borderRightWidth={1}
      borderColor="border.default"
      w="80px"
    >
      <Tooltip label="Chat" placement="right">
        <HStack w="full" justify="center">
          <IconButton
            aria-label="Chat"
            icon={<ChatIcon boxSize="1.5em" />}
            variant={active === "chat" ? "solid" : "ghost"}
            colorScheme="brand"
            onClick={() => onChange("chat")}
            isRound
            size="lg"
          />
        </HStack>
      </Tooltip>
      <Tooltip label="Knowledge Base" placement="right">
        <HStack w="full" justify="center">
          <IconButton
            aria-label="Knowledge Base"
            icon={<Image src="/rag.png" boxSize="1.5em" alt="RAG" />}
            variant={active === "kb" ? "solid" : "ghost"}
            colorScheme="brand"
            onClick={() => onChange("kb")}
            isRound
            size="lg"
          />
        </HStack>
      </Tooltip>
      <Tooltip label="Talk to PDF" placement="right">
        <HStack w="full" justify="center">
          <IconButton
            aria-label="Talk to PDF"
            icon={<Image src="/pdf-icon.png" boxSize="1.5em" alt="PDF" />}
            variant={active === "pdf" ? "solid" : "ghost"}
            colorScheme="brand"
            onClick={() => onChange("pdf")}
            isRound
            size="lg"
          />
        </HStack>
      </Tooltip>
      <Tooltip label="Grammar" placement="right">
        <HStack w="full" justify="center">
          <IconButton
            aria-label="Grammar check"
            icon={<Image src="/grammarly.png" boxSize="1.5em" alt="Grammar" />}
            variant={active === "grammar" ? "solid" : "ghost"}
            colorScheme="brand"
            onClick={() => onChange("grammar")}
            isRound
            size="lg"
          />
        </HStack>
      </Tooltip>
      <Tooltip label="Rewrite" placement="right">
        <HStack w="full" justify="center">
          <IconButton
            aria-label="Rewrite"
            icon={<Image src="/redraft.png" boxSize="1.5em" alt="Redraft" />}
            variant={active === "rewrite" ? "solid" : "ghost"}
            colorScheme="brand"
            onClick={() => onChange("rewrite")}
            isRound
            size="lg"
          />
        </HStack>
      </Tooltip>
    </VStack>
  );
}
