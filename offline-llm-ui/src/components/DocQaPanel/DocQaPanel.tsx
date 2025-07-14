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
  Tooltip,
  FormControl,
  FormLabel,
  Avatar,
  Tag,
} from "@chakra-ui/react";
import {
  AttachmentIcon,
  ArrowRightIcon,
  InfoOutlineIcon,
} from "@chakra-ui/icons";
import { useState, useRef, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import { uploadPdf, sessionQA, docQa, type SourceChunk } from "../../api";
import { AssistantBubble } from "../AssistantBubble/AssistantBubble";

export function DocQaPanel() {
  const toast = useToast();
  const { sessionId, model } = useChat();

  // File upload
  const [hasUploadedPdf, setHasUploadedPdf] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

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
      sources?: SourceChunk[];
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
  const onFileChange = async (
    e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>
  ) => {
    const f = 'dataTransfer' in e ? e.dataTransfer.files[0] : e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const resp = await uploadPdf(sessionId, f);
      toast({ status: 'success', description: `Indexed ${resp.chunks_indexed} chunks` });
      setHasUploadedPdf(true);
      setUploadedFiles((files) => Array.from(new Set([...files, f.name])));
    } catch (err: any) {
      toast({ status: 'error', description: err.message });
    } finally {
      setUploading(false);
      setIsDragOver(false);
      if ('target' in e) {
        (e.target as HTMLInputElement).value = '';
      }
    }
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
  const panelBg = 'brand.surface';
  const chatBg = 'brand.surface';
  const userBubbleBg = 'brand.primary';
  const userBubbleText = 'white';
  const aiBubbleBg = 'bg.muted';
  const aiBubbleText = 'text.primary';

  return (
    <Box
      w="100%"
      h="100%"
      flex={1}
      bg={panelBg}
      display="flex"
      flexDirection="column"
      overflow="hidden"
      px={{ base: 0, md: 0 }}
      py={0}
      borderLeftWidth="5px"
      borderLeftStyle="solid"
      borderLeftColor="brand.accent"
    >
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
        position="relative"
        sx={{
          scrollbarWidth: 'thin',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: "url('/sdd.png')",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'contain',
            opacity: 0.05,
            pointerEvents: 'none',
            zIndex: -1,
          },
        }}
      >
        {chat.length === 0 ? (
          <Box
            flex="1"
            display="flex"
            alignItems="center"
            justifyContent="center"
            minH={300}
          >
            <Text
              color="text.muted"
              fontSize="lg"
              fontWeight="medium"
              textAlign="center"
            >
              Ask a question about your uploaded PDF or knowledge base to begin.
            </Text>
          </Box>
        ) : (
          chat.map((item, idx) => (
            <Box key={idx} mb={2}>
              {/* User bubble */}
              <HStack justify="flex-end" mb={0.5} spacing={1.5}>
                <Avatar
                  size="xs"
                  bg="brand.primary"
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
                    <Text fontSize="xs" fontWeight="bold" color="brand.accent" mb={0.5}>
                      AI
                    </Text>
                   <Box mb={1} fontSize="sm" color={aiBubbleText}>
                      {item.answer ? (
                        <AssistantBubble text={item.answer} color={aiBubbleText} />
                      ) : item.pending ? (
                        <HStack spacing={2}>
                          <Spinner size="xs" color="spinner.color" />
                          <Text as="span" color="text.muted">Waiting for answer…</Text>
                        </HStack>
                      ) : null}
                    </Box>
                    {item.answer && (
                      <>
                        <Text
                          as="button"
                          fontSize="xs"
                          color="brand.accent"
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
                                <ListItem key={i} fontSize="xs" color="brand.accent">
                                  <AttachmentIcon boxSize={3} mb={-0.5} /> p.{s.page_number ?? "?"}: {s.snippet}
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

      {uploadedFiles.length > 0 && (
        <HStack px={2} py={1} spacing={2} flexWrap="wrap">
          {uploadedFiles.map((f) => (
            <Tag key={f} size="sm" variant="subtle" colorScheme="brand">
              {f}
            </Tag>
          ))}
        </HStack>
      )}

      {/* Switch */}
      <FormControl display="flex" alignItems="center" mb={2} mt={0.5} px={2}>
        <Switch
          id="only-doc-switch"
          isChecked={toggleDocOnly}
          onChange={(e) => setToggleDocOnly(e.target.checked)}
          colorScheme="brand"
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
                <InfoOutlineIcon color="text.muted" />
              </span>
            </Tooltip>
          </HStack>
        </FormLabel>
      </FormControl>

      {/* Controls */}
      <HStack spacing={2} mb={3} px={2} align="end">
        <Box
          flex={1}
          onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); onFileChange(e); }}
        >
          <Textarea
            placeholder="Query PDF or organisation knowledge base…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={onKeyDown}
            size="sm"
            borderRadius="xl"
            boxShadow="sm"
            _focus={{ borderColor: 'brand.accent', boxShadow: 'md' }}
            bg="bg.muted"
            fontSize="sm"
            borderColor={isDragOver ? 'brand.accent' : undefined}
            borderWidth={isDragOver ? '2px' : undefined}
            isDisabled={asking}
            resize="vertical"
            minH="80px"
            maxH="120px"
          />
        </Box>
        <input
          type="file"
          accept="application/pdf"
          id="doc-upload"
          style={{ display: 'none' }}
          onChange={onFileChange}
        />
        <IconButton
          aria-label="Attach PDF"
          icon={<AttachmentIcon color={hasUploadedPdf ? 'green.400' : undefined} />}
          variant="ghost"
          colorScheme="brand"
          borderRadius="full"
          size="md"
          onClick={() => document.getElementById('doc-upload')?.click()}
          isLoading={uploading}
          alignSelf="end"
        />
        <IconButton
          aria-label="Send"
          icon={asking ? <Spinner size="sm" /> : <ArrowRightIcon />}
          colorScheme="brand"
          borderRadius="full"
          size="md"
          onClick={onSend}
          isDisabled={asking || uploading || !question.trim()}
          boxShadow="md"
          alignSelf="end"
        />
      </HStack>
    </Box>
  );
}

