import { Flex, Text, useColorModeValue } from "@chakra-ui/react";

export function AppFooter() {
  const footerGradient = useColorModeValue(
    "linear(to-r, purple.600, blue.600)",
    "linear(to-r, purple.300, cyan.300)"
  );
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
      fontFamily="'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
      w="100%"
      position="sticky"
      bottom={0}
      zIndex={10} // keep above any content scrollbars
    >
      © {new Date().getFullYear()} EklavyaAI ·
      <Text
        as="span"
        bgGradient={footerGradient}
        bgClip="text"
        fontFamily="'Trebuchet MS','Segoe UI','Helvetica Neue',Arial,sans-serif"
        fontWeight={700}
      >
        Simulator Development Division
      </Text>{" "}
      (Devp and Designed by @hariomahlawat)
    </Flex>
  );
}
