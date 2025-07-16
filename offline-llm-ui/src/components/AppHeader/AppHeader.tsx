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
import AdminModal from "../AdminModal/AdminModal";

/* ────────────────────────── static cheat-sheets ─────────────────────────── */
// src/constants.ts

export const modelTable = [
  [
    "llama3:8b-instruct-q3_K_L",
    "4.3 GB (8 B params, Q3)",
    "≥ 7 GB VRAM",
    "Lightweight instruction following and chat on low-RAM GPUs"
  ],
  [
    "llama3:8b-instruct-q4_K_M",
    "4.9 GB (8 B params, Q4)",
    "≥ 9 GB VRAM",
    "Higher-fidelity summarization & reasoning with modest memory cost"
  ],
  [
    "codellama:7b",
    "3.8 GB (7 B code-fine-tuned)",
    "≥ 6 GB VRAM",
    "Python/JS completion, refactoring, and code explanations"
  ],
  [
    "deepseek-r1:latest",
    "5.2 GB (retrieval-aware)",
    "≥ 8 GB VRAM",
    "Fast semantic search & Q-A over large document collections"
  ],
  [
    "mistral:latest",
    "4.1 GB (7 B)",
    "≥ 7 GB VRAM",
    "General chat, compact reasoning, and multilingual dialogue"
  ],
  [
    "qwen2.5-coder:7b",
    "4.7 GB (7 B code-specialized)",
    "≥ 8 GB VRAM",
    "Multilingual code generation and comment synthesis"
  ],
];

export const promptTips = [
  [
    "Grammar / Clarity Pass",
    `“Please act as an editor. Rewrite the following text to improve grammar, brevity, and flow while preserving its meaning.”`
  ],
  [
    "Draft a Technical Paper",
    `“You are a technical writer. Structure your response as a paper with Abstract, Introduction, Methodology, Results, and Conclusion. Use IEEE citation style where sources are provided.”`
  ],
  [
    "Govt Ruling / Guideline Search",
    `“Search only official government gazettes, circulars, or statutory guidelines. Answer with the exact clause number and publication date. If no authoritative source is found, respond with ‘No official ruling found.’”`
  ],
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
  const adminModal = useDisclosure();

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
            boxSize={isMobile ? "36px" : "40px"}
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
            letterSpacing="wide"
            textAlign="center"
            fontFamily="'DejaVu Serif', 'Times New Roman', serif"
            bgGradient="linear(to-r, brand.700, secondary.500)"
            bgClip="text"
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
              <MenuItem onClick={adminModal.onOpen}>Admin Panel</MenuItem>

            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      {/* ═══════════ Model Guide modal ═══════════ */}
      <Modal isOpen={modelModal.isOpen} onClose={modelModal.onClose} size="xlg">
        <ModalOverlay />
        <ModalContent bg="brand.surface" color="text.secondary">
          <ModalHeader>Model selection guide</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Model Size</Th>
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
      <Modal isOpen={promptModal.isOpen} onClose={promptModal.onClose} size="xlg">
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
<Modal isOpen={aboutModal.isOpen} onClose={aboutModal.onClose} size="xlg">
  <ModalOverlay />
  <ModalContent bg="brand.surface" color="text.secondary">
    <ModalHeader>About EklavyaAI</ModalHeader>
    <ModalCloseButton />
    <ModalBody fontSize="sm" lineHeight={1.6}>

      <Text mb={4}>
        <strong>EklavyaAI</strong> is a fully-air-gapped, retrieval-augmented LLM assistant.
        All components, from PDF ingestion to vector search and inference, run locally.
      </Text>

      <Table variant="simple" size="xs" mb={4}>
        <Thead>
          <Tr>
            <Th w="20%">Layer</Th>
            <Th w="45%">Technology</Th>
            <Th w="35%">Role & Capabilities</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>LLM Inference</Td>
            <Td>
              Transformer-based models quantized to 3–4 bits (7B–8B parameters); optional 70 B model for deep reasoning (~45 GB RAM).
            </Td>
            <Td>
              Generates responses, summaries, and code; selectable precision vs. fidelity trade-offs.
            </Td>
          </Tr>
          <Tr>
            <Td>Vanilla Chat</Td>
            <Td>
              Direct chat mode using the default Ollama model (e.g. llama3:8b-instruct-q4_K_M).  
              Maintains rolling conversation history in-prompt up to 128 K tokens.
            </Td>
            <Td>
              Pure conversational AI without retrieval augment; ideal for free-form dialogue and brainstorming.
            </Td>
          </Tr>
          <Tr>
            <Td>PDF Ingestion & Embedding</Td>
            <Td>
              Page-level text extraction → tokenized & chunked (800 token windows, 100 token overlap).  
              Dense embeddings via on-device transformer encoder into 768+ dim vectors.
            </Td>
            <Td>
              Prepares document fragments for semantically grounded retrieval.
            </Td>
          </Tr>
          <Tr>
            <Td>Vector Search</Td>
            <Td>
              Approximate Nearest Neighbor (HNSW) index over embeddings in a SQLite backend.  
              Configurable top-k & dynamic-k retrieval with optional Max-Marginal-Relevance.
            </Td>
            <Td>
              Retrieves the most semantically similar chunks to the user’s query.
            </Td>
          </Tr>
          <Tr>
            <Td>Re-Ranking</Td>
            <Td>
              Deep cross-encoder ranks retrieved candidates with a distilled transformer.  
              Runs locally from `offline_llm_models/cross_encoder`.
            </Td>
            <Td>
              Ensures highest-quality context is passed into the LLM prompt.
            </Td>
          </Tr>
          <Tr>
            <Td>RAG Orchestration</Td>
            <Td>
              FastAPI + Uvicorn coordinate:  
              1) Retrieve & rerank → 2) Assemble system+user prompt → 3) Invoke LLM via python-ollama.  
              Asynchronous I/O for concurrency.
            </Td>
            <Td>
              Manages context assembly, prompt injection, and streaming or batch inference.
            </Td>
          </Tr>
          <Tr>
            <Td>Frontend & UX</Td>
            <Td>
              React 18 SPA with Chakra UI theming & Vite builds.  
              Dynamic pane layout, model selector, PDF upload drag-and-drop, prompt presets.
            </Td>
            <Td>
              Interactive chat UI with session persistence and panel resizing.
            </Td>
          </Tr>
        </Tbody>
      </Table>

      <Text>
        <em>Developed &amp; designed by </em>
          @hariomahlawat.
      </Text>

    </ModalBody>
  </ModalContent>
</Modal>

      <AdminModal isOpen={adminModal.isOpen} onClose={adminModal.onClose} />

    </>
  );
}
