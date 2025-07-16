import { Flex, Text } from "@chakra-ui/react";

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
      fontFamily="'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
      w="100%"
      position="sticky"
      bottom={0}
      zIndex={10} // keep above any content scrollbars
    >
      <Text>
        © {new Date().getFullYear()} EklavyaAI ·{' '}
        <Text as="span" color="brand.accent" fontWeight="medium">
          Designed &amp; developed by Hari Om Ahlawat | @hariomahlawat
        </Text>
      </Text>
    </Flex>
  );
}
