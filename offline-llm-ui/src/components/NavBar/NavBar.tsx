import { VStack, IconButton, Tooltip } from "@chakra-ui/react";
import { ChatIcon, AttachmentIcon } from "@chakra-ui/icons";

export type NavMode = "chat" | "docqa";

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
      <Tooltip label="PDF & KB" placement="right">
        <IconButton
          aria-label="PDF and KB"
          icon={<AttachmentIcon />}
          variant={active === "docqa" ? "solid" : "ghost"}
          colorScheme="brand"
          onClick={() => onChange("docqa")}
          isRound
        />
      </Tooltip>
    </VStack>
  );
}
