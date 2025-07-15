import {
  Box,
  HStack,
  Textarea,
  IconButton,
  Text,
  Spinner,
  useToast,
  UnorderedList,
  ListItem,
  Collapse,
  Avatar,
  Tag,
} from "@chakra-ui/react";
import {
  AttachmentIcon,
  ArrowRightIcon,
} from "@chakra-ui/icons";
import { useState, useRef, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import { docQa, adminUploadPdf, type SourceChunk } from "../../api";
import { AssistantBubble } from "../AssistantBubble/AssistantBubble";

export function KnowledgeBasePanel() {
  const toast = useToast();
  const { model } = useChat();

  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
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
  const chatBottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const onFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const password = window.prompt("Admin password for upload") || "";
    if (!password) return;
    setUploading(true);
    try {
      const resp = await adminUploadPdf(f, password);
      toast({ status: "success", description: `Indexed ${resp.filename}` });
      setUploadedFiles((files) => Array.from(new Set([...files, f.name])));
    } catch (err: any) {
      toast({ status: "error", description: err.message });
    } finally {
      setUploading(false);
      (e.target as HTMLInputElement).value = "";
    }
  };

  const onSend = async () => {
    if (!question.trim()) return;
    setAsking(true);
    const thisQuestion = question;
    setQuestion("");

    setChat((prev) => [
      ...prev,
      { question: thisQuestion, pending: true },
    ]);

    try {
      const resp = await docQa(thisQuestion, undefined, model);
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

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && question.trim() && !asking) {
      e.preventDefault();
      onSend();
    }
  };

  const toggleSources = (idx: number) => {
    setChat((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, showSources: !item.showSources } : item
      )
    );
  };

  const panelBg = "brand.surface";
  const chatBg = "brand.surface";
  const userBubbleBg = "brand.primary";
  const userBubbleText = "white";
  const aiBubbleBg = "bg.muted";
  const aiBubbleText = "text.primary";

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
      borderLeftWidth="0px"
      borderLeftStyle="solid"
      borderLeftColor="brand.accent"
    >
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
          scrollbarWidth: "thin",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/sdd.png')",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "contain",
            opacity: 0.05,
            pointerEvents: "none",
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
              Ask a question about your knowledge base to begin.
            </Text>
          </Box>
        ) : (
          chat.map((item, idx) => (
            <Box key={idx} mb={2}>
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

      <HStack spacing={2} mb={3} px={2} align="end">
        <Box flex={1}>
          <Textarea
            placeholder="Ask the knowledge base…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={onKeyDown}
            size="sm"
            borderRadius="xl"
            boxShadow="sm"
            _focus={{ borderColor: 'brand.accent', boxShadow: 'md' }}
            bg="bg.muted"
            fontSize="sm"
            isDisabled={asking}
            resize="vertical"
            minH="80px"
            maxH="120px"
          />
        </Box>
        <input
          type="file"
          accept="application/pdf"
          id="kb-upload"
          style={{ display: 'none' }}
          onChange={onFileChange}
        />
        <IconButton
          aria-label="Add PDF to knowledge base"
          icon={<AttachmentIcon />}
          variant="ghost"
          colorScheme="brand"
          borderRadius="full"
          size="md"
          onClick={() => document.getElementById('kb-upload')?.click()}
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
          isDisabled={asking || !question.trim()}
          boxShadow="md"
          alignSelf="end"
        />
      </HStack>
    </Box>
  );
}
