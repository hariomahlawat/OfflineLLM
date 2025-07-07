import {
  Flex,
  Heading,
  Image,
  Box,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { ModelSelector } from "./../ModelSelector/ModelSelector";

export function AppHeader() {
  // Colors
  const matteBg = "#22232b"; // Matte black header
  const orgColor = "#e8eaf3"; // Soft off-white for center
  const mainHeadingColor = "#ffe3a3"; // Warm pastel gold
  const subtitleColor = "#b8bdc9"; // Muted gray/blue

  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Flex
      as="header"
      align="center"
      px={{ base: 2, md: 6 }}
      py={{ base: 1.5, md: 2 }}
      bg={matteBg}
      borderBottomWidth={1}
      borderColor="#232436"
      position="sticky"
      top={0}
      zIndex={20}
      w="100%"
      minH={{ base: "48px", md: "58px" }}
      fontFamily="Inter, system-ui, sans-serif"
    >
      {/* Logo + App Name */}
      <Flex align="center" minW="200px">
        <Image
          src="/sdd.png"
          alt="Logo"
          boxSize={isMobile ? "26px" : "32px"}
          mr={2}
          borderRadius="md"
          bg="white"
          p={1}
          boxShadow="sm"
        />
        <Box>
          <Heading
            as="h1"
            fontSize={isMobile ? "md" : "lg"}
            fontWeight={700}
            color={mainHeadingColor}
            letterSpacing="tight"
            lineHeight={1.1}
            mb={-1}
          >
            EklavyaAI Chat
          </Heading>
          <Text fontSize="xs" color={subtitleColor}>
            Ask Anything. Learn Like Eklavya.
          </Text>
        </Box>
      </Flex>

      {/* Center: Organisation Name */}
      <Flex flex="1" justify="center" align="center" px={2}>
        <Heading
          fontWeight={700}
          fontSize={isMobile ? "md" : "xl"}
          color={orgColor}
          letterSpacing="wide"
          textAlign="center"
          fontFamily="inherit"
        >
          Simulator Development Division
        </Heading>
      </Flex>

      {/* Right: Model Selector only */}
      <Flex align="center" minW="180px">
        <Box
          minW={["120px", "180px"]}
          ml={{ base: 2, md: 6 }}
          display="flex"
          alignItems="center"
        >
          <Box
            border="1px solid #e2e8f0"
            borderRadius="md"
            bg="white"
            px={2}
            py={0.5}
            boxShadow="xs"
          >
            <ModelSelector />
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
}
