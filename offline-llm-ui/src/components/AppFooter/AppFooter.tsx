import { Flex, useColorModeValue } from "@chakra-ui/react";

export function AppFooter() {
  return (
    <Flex
      as="footer"
      align="center"
      justify="center"
      py={2}
      bg={useColorModeValue("gray.100", "gray.900")}
      borderTopWidth={1}
      borderColor={useColorModeValue("gray.200", "gray.700")}
      fontSize="sm"
      color={useColorModeValue("gray.600", "gray.400")}
      w="100%"
      position="sticky"
      bottom={0}
      zIndex={10} // keep above any content scrollbars
    >
      © {new Date().getFullYear()} EklavyaAI · Simulator Development Division (Devp and Designed by @hariomahlawat)
    </Flex>
  );
}
