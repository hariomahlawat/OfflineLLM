import { VStack, IconButton, Tooltip } from "@chakra-ui/react";
import { ChatIcon, AttachmentIcon, EditIcon, RepeatIcon, InfoOutlineIcon } from "@chakra-ui/icons";

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
      w="60px"
    >
      <Tooltip label="Chat" placement="right">
        <IconButton
          aria-label="Chat"
          icon={<ChatIcon />}
          variant={active === "chat" ? "solid" : "ghost"}
          colorScheme="brand"
          onClick={() => onChange("chat")}
          isRound
        />
      </Tooltip>
      <Tooltip label="Knowledge Base" placement="right">
        <IconButton
          aria-label="Knowledge Base"
          icon={<InfoOutlineIcon />}
          variant={active === "kb" ? "solid" : "ghost"}
          colorScheme="brand"
          onClick={() => onChange("kb")}
          isRound
        />
      </Tooltip>
      <Tooltip label="Talk to PDF" placement="right">
        <IconButton
          aria-label="Talk to PDF"
          icon={<AttachmentIcon />}
          variant={active === "pdf" ? "solid" : "ghost"}
          colorScheme="brand"
          onClick={() => onChange("pdf")}
          isRound
        />
      </Tooltip>
      <Tooltip label="Grammar" placement="right">
        <IconButton
          aria-label="Grammar check"
          icon={<EditIcon />}
          variant={active === "grammar" ? "solid" : "ghost"}
          colorScheme="brand"
          onClick={() => onChange("grammar")}
          isRound
        />
      </Tooltip>
      <Tooltip label="Rewrite" placement="right">
        <IconButton
          aria-label="Rewrite"
          icon={<RepeatIcon />}
          variant={active === "rewrite" ? "solid" : "ghost"}
          colorScheme="brand"
          onClick={() => onChange("rewrite")}
          isRound
        />
      </Tooltip>
    </VStack>
  );
}
