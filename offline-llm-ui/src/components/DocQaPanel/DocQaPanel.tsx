import {
  Box,
  HStack,
  Textarea,
  IconButton,
  Switch,
  Text,
  Spinner,
  useToast,
  UnorderedList,
  ListItem,
  Collapse,
  useColorModeValue,
  Tooltip,
  FormControl,
  FormLabel,
  Avatar,
} from "@chakra-ui/react";
import {
  AttachmentIcon,
  ArrowRightIcon,
  InfoOutlineIcon,
  CheckCircleIcon,
  CloseIcon,
} from "@chakra-ui/icons";
import { useState, useRef, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import { uploadPdf, sessionQA, docQa } from "../../api";
import ReactMarkdown from "react-markdown";

export function DocQaPanel() {
  const toast = useToast();
  const { sessionId, model } = useChat();

  // File upload
  const [hasUploadedPdf, setHasUploadedPdf] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Drag-over effect
  const [isDragOver, setIsDragOver] = useState(false);

  // Controls
  const [toggleDocOnly, setToggleDocOnly] = useState(false);
  const [question, setQuestion] = useState("");

  // Chat history
  const [chat, setChat] = useState<
    {
      question: string;
      answer?: string;
      sources?: string[];
      showSources?: boolean;
      pending?: boolean;
    }[]
  >([]);
  const [asking, setAsking] = useState(false);

  // Scroll to bottom when chat updates
  const chatBottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // File upload handler
  const onFileChange = async (e: any) => {
    const f = e.target.files?.[0] || (e.dataTransfer && e.dataTransfer.files[0]);
    if (!f) return;
    setUploading(true);
    try {
      const resp = await uploadPdf(sessionId, f);
      toast({ status: "success", description: `Indexed ${resp.chunks_indexed} chunks` });
      setHasUploadedPdf(true);
      setUploadedFileName(f.name);
    } catch (err: any) {
      toast({ status: "error", description: err.message });
    } finally {
      setUploading(false);
      setIsDragOver(false);
    }
  };

  // Remove PDF
  const onRemovePdf = () => {
    setHasUploadedPdf(false);
    setUploadedFileName(null);
  };

  // Send question handler
  const onSend = async () => {
    if (!question.trim()) return;
    setAsking(true);
    const thisQuestion = question;
    setQuestion(""); // Clear input immediately

    setChat((prev) => [
      ...prev,
      {
        question: thisQuestion,
        pending: true,
      },
    ]);

    try {
      let resp;
      if (toggleDocOnly && hasUploadedPdf) {
        resp = await docQa(thisQuestion, sessionId, model);
      } else if (hasUploadedPdf) {
        resp = await sessionQA(thisQuestion, sessionId, model);
      } else {
        resp = await docQa(thisQuestion, undefined, model);
      }

      setChat((prev) => {
        const lastIdx = prev.length - 1;
        return prev.map((item, idx) =>
          idx === lastIdx
            ? {
                ...item,
                answer: resp.answer,
                sources: resp.sources,
                showSources: false,
                pending: false,
              }
            : item
        );
      });
    } catch (err: any) {
      toast({ status: "error", description: err.message });
      setChat((prev) => prev.slice(0, -1));
    } finally {
      setAsking(false);
    }
  };

  // Enter + Shift for newline, Enter alone to send
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && question.trim() && !asking) {
      e.preventDefault();
      onSend();
    }
  };

  // Toggle sources
  const toggleSources = (idx: number) => {
    setChat((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, showSources: !item.showSources } : item
      )
    );
  };

  // UI Colors
  const panelBg = useColorModeValue("gray.50", "gray.900");
  const chatBg = useColorModeValue("white", "gray.800");
  const userBubbleBg = useColorModeValue("blue.400", "blue.600");
  const userBubbleText = "white";
  const aiBubbleBg = useColorModeValue("gray.100", "gray.700");
  const aiBubbleText = useColorModeValue("gray.900", "white");

  return (
    <Box
      w="100%"
      h="100%"
      flex={1}
      bg={panelBg}
      borderRadius="2xl"
      boxShadow="md"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      px={{ base: 0, md: 0 }}
      py={0}
      borderLeft="5px solid #3182ce" // Brand accent
    >
      {/* File Upload */}
      <Box
        borderWidth="2px"
        borderStyle="dashed"
        borderColor={isDragOver ? "blue.400" : "gray.200"}
        bg={isDragOver ? "blue.50" : undefined}
        borderRadius="xl"
        p={4}
        mt={3}
        mb={2}
        textAlign="center"
        cursor="pointer"
        onClick={() => document.getElementById("doc-upload")?.click()}
        onDragEnter={e => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={e => { e.preventDefault(); setIsDragOver(false); }}
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
        onDrop={e => { e.preventDefault(); setIsDragOver(false); onFileChange(e); }}
        transition="all 0.2s"
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="relative"
        minH="56px"
      >
        <AttachmentIcon boxSize={5} color="gray.500" mr={2} />
        <input
          type="file"
          accept="application/pdf"
          id="doc-upload"
          style={{ display: "none" }}
          onChange={onFileChange}
        />
        {uploading ? (
          <Text fontWeight="medium">Uploading...</Text>
        ) : hasUploadedPdf && uploadedFileName ? (
          <HStack spacing={2} justify="center" align="center">
            <Text fontWeight="medium" color="green.600" isTruncated maxW="180px" fontSize="sm">
              {uploadedFileName}
            </Text>
            <CheckCircleIcon color="green.400" />
            <IconButton
              aria-label="Remove PDF"
              icon={<CloseIcon fontSize="xs" />}
              size="xs"
              colorScheme="gray"
              variant="ghost"
              onClick={e => { e.stopPropagation(); onRemovePdf(); }}
            />
          </HStack>
        ) : (
          <Text fontWeight="medium" fontSize="sm">
            Click or drag PDF here to upload
          </Text>
        )}
      </Box>

      {/* Chat history */}
      <Box
        flex="1"
        h="100%"
        overflowY="auto"
        mb={2}
        borderRadius="xl"
        bg={chatBg}
        p={2}
        display="flex"
        flexDirection="column"
        maxW="100%"
        minH="240px"
        sx={{ scrollbarWidth: "thin" }}
      >
        {chat.length === 0 ? (
          <Text color="gray.400" textAlign="center" py={10} fontSize="sm">
            Ask a question about your uploaded PDF or knowledge base to begin.
          </Text>
        ) : (
          chat.map((item, idx) => (
            <Box key={idx} mb={2}>
              {/* User bubble */}
              <HStack justify="flex-end" mb={0.5} spacing={1.5}>
                <Avatar
                  size="xs"
                  bg="blue.500"
                  color="white"
                  name="You"
                  icon={<span role="img" aria-label="user">🧑</span>}
                  mr={1}
                />
                <Box
                  bg={userBubbleBg}
                  color={userBubbleText}
                  borderRadius="2xl"
                  px={3}
                  py={1.5}
                  maxW="60%"
                  boxShadow="md"
                  alignSelf="flex-end"
                >
                  <Text fontSize="xs" fontWeight="bold" color="white" mb={0.5}>
                    You
                  </Text>
                  <Text fontSize="sm" wordBreak="break-word">
                    {item.question}
                  </Text>
                </Box>
              </HStack>
              {/* AI bubble */}
              {(item.answer !== undefined || item.pending) && (
                <HStack justify="flex-start" mt={0.5} spacing={1.5}>
                  <Box
                    bg={aiBubbleBg}
                    color={aiBubbleText}
                    borderRadius="2xl"
                    px={3}
                    py={1.5}
                    maxW="60%"
                    boxShadow="sm"
                    alignSelf="flex-start"
                  >
                    <Text fontSize="xs" fontWeight="bold" color="blue.600" mb={0.5}>
                      AI
                    </Text>
                    <Box mb={1} fontSize="sm" color={aiBubbleText} sx={{
                      ul: { pl: 4, mb: 2 },
                      ol: { pl: 4, mb: 2 },
                      li: { mb: 1 },
                      strong: { fontWeight: 700 },
                      code: {
                        bg: useColorModeValue("#f5f5f5", "#333"),
                        px: 1, borderRadius: "sm", fontSize: "0.97em"
                      },
                      pre: {
                        bg: useColorModeValue("#f5f5f5", "#333"),
                        borderRadius: "md", p: 2, mb: 2, fontSize: "0.97em",
                        overflowX: "auto"
                      },
                      h1: { fontSize: "md", mb: 1, mt: 1 },
                      h2: { fontSize: "sm", mb: 1, mt: 1 },
                      h3: { fontSize: "sm", mb: 1, mt: 1 },
                      a: { color: "blue.500", textDecoration: "underline" },
                      p: { mb: 2 }
                    }}>
                      {item.pending ? (
                        <Spinner size="xs" color="blue.500" mr={2} />
                      ) : null}
                      {item.answer ? (
                        <ReactMarkdown>{item.answer}</ReactMarkdown>
                      ) : item.pending ? (
                        <Text as="span" color="gray.400">
                          Waiting for answer…
                        </Text>
                      ) : null}
                    </Box>
                    {item.answer && (
                      <>
                        <Text
                          as="button"
                          fontSize="xs"
                          color="blue.600"
                          _hover={{ textDecoration: "underline" }}
                          onClick={() => toggleSources(idx)}
                          aria-label={item.showSources ? "Hide sources" : "Show sources"}
                        >
                          {item.showSources ? "Hide Sources" : "Show Sources"}
                        </Text>
                        <Collapse in={item.showSources} animateOpacity>
                          <Box mt={1}>
                            <UnorderedList spacing={1} pl={4}>
                              {item.sources?.map((s, i) => (
                                <ListItem key={i} fontSize="xs" color="blue.800">
                                  <AttachmentIcon boxSize={3} mb={-0.5} /> {s}
                                </ListItem>
                              ))}
                            </UnorderedList>
                          </Box>
                        </Collapse>
                      </>
                    )}
                  </Box>
                </HStack>
              )}
            </Box>
          ))
        )}
        <div ref={chatBottomRef} />
      </Box>

      {/* Switch */}
      <FormControl display="flex" alignItems="center" mb={2} mt={0.5} px={2}>
        <Switch
          id="only-doc-switch"
          isChecked={toggleDocOnly}
          onChange={(e) => setToggleDocOnly(e.target.checked)}
          colorScheme="blue"
          mr={2}
        />
        <FormLabel
          htmlFor="only-doc-switch"
          mb="0"
          fontWeight="medium"
          cursor="pointer"
          fontSize="sm"
        >
          <HStack spacing={2}>
            <Text fontSize="sm">
              {toggleDocOnly
                ? "Only Uploaded PDF"
                : "Knowledgebase + Uploaded PDF"}
            </Text>
            <Tooltip
              label="Switch ON to answer strictly from the uploaded PDF only. Switch OFF to answer using both the organisation's knowledgebase and the uploaded PDF."
              fontSize="sm"
              placement="right"
              hasArrow
            >
              <span>
                <InfoOutlineIcon color="gray.400" />
              </span>
            </Tooltip>
          </HStack>
        </FormLabel>
      </FormControl>

      {/* Controls */}
      <HStack spacing={2} mb={3} px={2} align="end">
        <Textarea
          placeholder="Query PDF or organisation knowledge base…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          size="sm"
          borderRadius="xl"
          boxShadow="sm"
          _focus={{ borderColor: "blue.400", boxShadow: "md" }}
          bg="gray.50"
          fontSize="sm"
          flex={1}
          isDisabled={asking}
          resize="vertical"
          minH="80px"
          maxH="120px"
        />
        <IconButton
          aria-label="Send"
          icon={asking ? <Spinner size="sm" /> : <ArrowRightIcon />}
          colorScheme="blue"
          borderRadius="full"
          size="md"
          onClick={onSend}
          isDisabled={asking || !question.trim()}
          boxShadow="md"
          alignSelf="end"
        />
      </HStack>
    </Box>
  );
}