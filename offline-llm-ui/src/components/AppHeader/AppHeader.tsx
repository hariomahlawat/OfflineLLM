import {
  Box,
  Flex,
  Heading,
  Image,
  Text,
  useBreakpointValue,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
  Link,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";
import { FiMoreVertical } from "react-icons/fi";
import { ModelSelector } from "../ModelSelector/ModelSelector";

/* ────────────────────────── static cheat-sheets ─────────────────────────── */
const modelTable = [
  ["Mistral-7B v0.3", "Feb 2025", "32 K", "Highest accuracy & citations"],
  ["Phi-3 3.8 B", "Oct 2024", "128 K", "Fast, low RAM"],
  ["Llama-3 8 B", "Jan 2024", "128 K", "Very long docs, creative"],
  ["Llama-3 70 B*", "Jan 2024", "128 K", "Deep reasoning (≈45 GB)"], // new row
];

const promptTips = [
  ["System", 'You are a factual assistant. If unsure, say “I don’t know.”'],
  ["RAG ask", "Answer from CONTEXT only and cite file+page."],
  ["Long docs", "Summarise each section in ≤ 120 words before full answer."],
];

export function AppHeader() {
  const { colorMode, toggleColorMode } = useColorMode()
  /* palette */
  const matteBg = useColorModeValue("gray.100", "#22232b");
  const orgColor = useColorModeValue("gray.700", "#e8eaf3");
  const mainHeadingColor = useColorModeValue("blue.600", "#ffe3a3");
  const subtitleColor = useColorModeValue("gray.500", "#b8bdc9");

  const isMobile = useBreakpointValue({ base: true, md: false });

  /* modal handles */
  const modelModal = useDisclosure();
  const promptModal = useDisclosure();
  const aboutModal = useDisclosure();

  return (
    <>
      {/* ════════════════════ HEADER BAR ════════════════════ */}
      <Flex
        as="header"
        align="center"
        px={{ base: 2, md: 6 }}
        py={{ base: 1.5, md: 2 }}
        bg={matteBg}
        borderBottomWidth={1}
        borderColor={useColorModeValue("gray.200", "#232436")}
        position="sticky"
        top={0}
        zIndex={20}
        w="100%"
        minH={{ base: "48px", md: "58px" }}
        fontFamily="'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
      >
        {/* logo + title */}
        <Flex align="center" minW="200px">
          <Image
            src="/sdd.png"
            alt="Logo"
            boxSize={isMobile ? "26px" : "32px"}
            mr={2}
            borderRadius="md"
            bg="brand.surface"
            p={1}
            boxShadow="sm"
          />
          <Box>
            <Heading
              fontSize={isMobile ? "md" : "lg"}
              fontWeight={700}
              color={mainHeadingColor}
              lineHeight={1.1}
              mb={-1}
            >
              EklavyaAI&nbsp;
            </Heading>
            <Text fontSize="xs" color={subtitleColor}>
              Ask Anything.&nbsp; Learn Like Eklavya.
            </Text>
          </Box>
        </Flex>

        {/* centre org name */}
        <Flex flex="1" justify="center">
          <Heading
            fontSize={isMobile ? "md" : "xl"}
            fontWeight={700}
            color={orgColor}
            letterSpacing="wide"
            textAlign="center"
          >
            Simulator&nbsp;Development&nbsp;Division
          </Heading>
        </Flex>

        {/* right: model selector & kebab */}
        <Flex align="center" gap={3} minW="200px">
          <Box
            border="1px solid"
            borderColor="border.default"
            borderRadius="md"
            bg="brand.surface"
            px={2}
            py={0.5}
            boxShadow="xs"
          >
            <ModelSelector />
          </Box>

          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
            variant="ghost"
            onClick={toggleColorMode}
          />


          <Menu>
            <MenuButton
              as={IconButton}
              icon={<Icon as={FiMoreVertical} />}
              variant="ghost"
              aria-label="Options"
              color="text.secondary"
              _hover={{ color: "white" }}
            />
            <MenuList fontSize="sm">
              <MenuItem onClick={modelModal.onOpen}>Model guide</MenuItem>
              <MenuItem onClick={promptModal.onOpen}>Prompt tips</MenuItem>
              <MenuItem onClick={aboutModal.onOpen}>About this app</MenuItem>
              <MenuItem as={Link} href="/admin.html">Admin Panel</MenuItem>

            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      {/* ═══════════ Model Guide modal ═══════════ */}
      <Modal isOpen={modelModal.isOpen} onClose={modelModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg="brand.surface" color="text.secondary">
          <ModalHeader>Model selection guide</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Cut-off</Th>
                  <Th>Context</Th>
                  <Th>Best for…</Th>
                </Tr>
              </Thead>
              <Tbody>
                {modelTable.map(([n, k, c, w]) => (
                  <Tr key={n as string}>
                    <Td>{n}</Td>
                    <Td>{k}</Td>
                    <Td>{c}</Td>
                    <Td>{w}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Text mt={3} fontSize="xs" color="text.muted">
              Context = prompt + retrieved chunks visible to the model. <br />
              * 70 B model requires ≈ 45 GB RAM (deployment mode).
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ═══════════ Prompt Tips modal ═══════════ */}
      <Modal isOpen={promptModal.isOpen} onClose={promptModal.onClose} size="md">
        <ModalOverlay />
        <ModalContent bg="brand.surface" color="text.secondary">
          <ModalHeader>Prompt quick-reference</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th w="30%">Type</Th>
                  <Th>Example</Th>
                </Tr>
              </Thead>
              <Tbody>
                {promptTips.map(([t, ex]) => (
                  <Tr key={t as string}>
                    <Td>{t}</Td>
                    <Td>{ex}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ═══════════ About modal ═══════════ */}
      <Modal isOpen={aboutModal.isOpen} onClose={aboutModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg="brand.surface" color="text.secondary">
          <ModalHeader>About EklavyaAI Chat</ModalHeader>
          <ModalCloseButton />
          <ModalBody fontSize="sm" lineHeight={1.55}>
            <Text mb={4}>
              <strong>EklavyaAI</strong> is an offline, retrieval‑augmented
              conversational assistant purpose‑built for the Simulator
              Development Division (SDD). It is fully air‑gapped: <strong>all</strong> large‑language‑model inference, vector retrieval and document processing run on local infrastructure—no cloud calls, telemetry, or external connectivity.
              <br />
              <br />
              <em>Developed &amp; designed by </em>
              <Link href="https://github.com/hariomahlawat" isExternal color="link.color">
                @hariomahlawat
              </Link>
              .
            </Text>

            <Table variant="simple" size="xs" mb={4}>
              <Thead>
                <Tr>
                  <Th w="34%">Layer</Th>
                  <Th>Stack</Th>
                  <Th w="34%">Role</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td>LLM runtime</Td>
                  <Td>
                    Ollama<br />
                    &nbsp;• Mistral‑7B v0.3 (default)<br />
                    &nbsp;• Phi‑3 3.8 B<br />
                    &nbsp;• Llama‑3 8 B<br />
                    &nbsp;• Llama‑3 70 B (≈ 45 GB)
                  </Td>
                  <Td>On‑prem model inference</Td>
                </Tr>
                <Tr>
                  <Td>RAG engine</Td>
                  <Td>FastAPI · Chroma · MiniLM reranker</Td>
                  <Td>Chunk retrieve + citation</Td>
                </Tr>
                <Tr>
                  <Td>Ingestion</Td>
                  <Td>PyMuPDF · Nomic‑Embed‑Text</Td>
                  <Td>PDF split &amp; vectorise</Td>
                </Tr>
                <Tr>
                  <Td>Frontend</Td>
                  <Td>React 18 · Chakra UI</Td>
                  <Td>Chat UI, uploads, model switch</Td>
                </Tr>
              </Tbody>
            </Table>

            <Text>
              Supports <strong>128 K‑token</strong> context windows for very
              long documents while remaining memory‑efficient. The 70 B‑parameter configuration targets high‑end deployments that demand deeper reasoning at the cost of ~45 GB RAM.
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
