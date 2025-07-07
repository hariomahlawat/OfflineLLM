import { Flex } from "@chakra-ui/react";

export function AppFooter() {
  return (
    <Flex
      as="footer"
      align="center"
      justify="center"
      py={2}
      bg="gray.100"
      borderTopWidth={1}
      borderColor="gray.200"
      fontSize="sm"
      color="gray.600"
      w="100%"
      position="relative"
    >
      © {new Date().getFullYear()} EklavyaAI Chat · Simulator Development Division (Devp and Designed by @hariomahlawat)
    </Flex>
  );
}
