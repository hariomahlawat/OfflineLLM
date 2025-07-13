import { Flex, useColorModeValue } from "@chakra-ui/react";

export function AppFooter() {
  return (
    <Flex
      as="footer"
      align="center"
      justify="center"
      py={2}
      bg="bg.muted"
      borderTopWidth={1}
      borderColor="border.default"
      fontSize="sm"
      color="text.secondary"
      w="100%"
      position="sticky"
      bottom={0}
      zIndex={10} // keep above any content scrollbars
    >
      © {new Date().getFullYear()} EklavyaAI · Simulator Development Division (Devp and Designed by @hariomahlawat)
    </Flex>
  );
}
