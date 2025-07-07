import {
  Flex, Heading, Image, Box, Text,
  useColorMode, IconButton
} from "@chakra-ui/react";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";
import { ModelSelector } from "./../ModelSelector/ModelSelector";

export function AppHeader() {
  // Fixed matte black color, not using useColorModeValue for header bg
  const matteBg = "#22232b"; // Matte black, change as needed
  const mainHeadingColor = "white";
  const orgColor = "#f3f4fa"; // Off-white/pale pastel
  const subtitleColor = "#dbe2ea"; // Lighter gray/blue

  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Flex
      as="header"
      align="center"
      px={{ base: 2, md: 6 }}
      py={{ base: 1, md: 2 }}
      boxShadow="sm"
      bg={matteBg}
      borderBottomWidth={0}
      position="sticky"
      top={0}
      zIndex={20}
      w="100%"
      minH={{ base: "54px", md: "62px" }}
      fontFamily="system-ui, sans-serif"
      letterSpacing="normal"
    >
      {/* Logo and App Name */}
      <Flex align="center" minW="220px">
        <Image
          src="/sdd.png"
          alt="EklavyaAI Logo"
          boxSize={{ base: "26px", md: "36px" }}
          borderRadius="lg"
          mr={2}
          fallbackSrc="https://via.placeholder.com/36"
        />
        <Box>
          <Heading
            as="h1"
            size="md"
            fontWeight={600}
            letterSpacing="normal"
            color={mainHeadingColor}
            lineHeight={1.1}
          >
            EklavyaAI Chat
          </Heading>
          <Text fontSize="sm" color={subtitleColor} mt={-0.5}>
            Ask Anything. Learn Like Eklavya.
          </Text>
        </Box>
      </Flex>

      {/* Centered Org Name */}
      <Flex
        flex="1"
        justify="center"
        align="center"
        px={2}
        display={{ base: "none", md: "flex" }}
      >
        <Heading
          fontWeight={500}
          fontSize={{ base: "md", md: "lg", lg: "xl" }}
          color={orgColor}
          letterSpacing="wide"
          textAlign="center"
        >
          Simulator Development Division
        </Heading>
      </Flex>

      {/* Right: Model Selector & Dark Mode */}
      <Flex align="center" minW="170px" justify="flex-end">
        <Box minW={["90px", "150px"]} ml={{ base: 2, md: 6 }}>
          <ModelSelector />
        </Box>
        <IconButton
          ml={3}
          aria-label="Toggle dark mode"
          onClick={toggleColorMode}
          variant="ghost"
          size="lg"
          icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
          color="white"
          _focus={{ outline: "none" }}
        />
      </Flex>
    </Flex>
  );
}
