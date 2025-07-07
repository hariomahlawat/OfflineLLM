// src/components/DocQaPanel/DocQaPanel.tsx
import {
  HStack,
  Input,
  IconButton,
  Switch,
  Text,
  Spinner,
  useToast,
  Box,
  ListItem,
  UnorderedList,
} from "@chakra-ui/react";
import { AttachmentIcon, ArrowRightIcon } from "@chakra-ui/icons";
import { useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import { uploadPdf, sessionQA, docQa } from "../../api";

export function DocQaPanel() {
  const toast = useToast();
  const { sessionId, model } = useChat();

  // have we successfully ingested at least one PDF this session?
  const [hasUploadedPdf, setHasUploadedPdf] = useState(false);

  // spinners
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking]       = useState(false);

  // controls
  const [toggleDocOnly, setToggleDocOnly] = useState(false);
  const [question, setQuestion]           = useState("");

  // results
  const [answer, setAnswer]   = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);

  // 1️⃣  fire immediately on file pick
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setUploading(true);
    try {
      const resp = await uploadPdf(sessionId, f);
      toast({ status: "success", description: `Indexed ${resp.chunks_indexed} chunks` });
      setHasUploadedPdf(true);
    } catch (err: any) {
      toast({ status: "error", description: err.message });
    } finally {
      setUploading(false);
    }
  };

  // 2️⃣  send question
  const onSend = async () => {
    if (!question.trim()) return;
    setAsking(true);

    try {
      let resp;
      if (toggleDocOnly) {
        // only from uploaded PDF
        resp = await docQa(question, sessionId, model);
        //toast({ status: "success", description: `Answer recd from persistent RAG- ${resp.answer} ` });
      } else if (hasUploadedPdf) {
        // session + persistent RAG
        resp = await sessionQA(question, sessionId, model);
        //toast({ status: "success", description: `Answer recd from session + persistent RAG- ${resp.answer} ` });
      } else {
        // no PDF yet → fall back to permanent KB only
        resp = await docQa(question, undefined, model);
        //toast({ status: "success", description: `Answer recd from persistent RAG- ${resp.answer} ` });
      }

      setAnswer(resp.answer);
      setSources(resp.sources);
    } catch (err: any) {
      toast({ status: "error", description: err.message });
    } finally {
      setAsking(false);
      setQuestion("");
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="md">
      <HStack spacing={2} mb={4}>
        {/* hidden file input */}
        <input
          type="file"
          accept="application/pdf"
          id="doc-upload"
          style={{ display: "none" }}
          onChange={onFileChange}
        />

        {/* 📄 upload */}
        <IconButton
          aria-label="Upload PDF"
          icon={uploading ? <Spinner size="xs" /> : <AttachmentIcon />}
          onClick={() => document.getElementById("doc-upload")?.click()}
          isDisabled={uploading}
        />

        {/* 📝 question */}
        <Input
          placeholder="Ask a question…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          flex="1"
        />

        {/* ➡️ send */}
        <IconButton
          aria-label="Send"
          icon={<ArrowRightIcon />}
          onClick={onSend}
          isLoading={asking}
          isDisabled={asking || !question.trim()}
        />

        {/* 🔄 only document */}
        <HStack spacing={1}>
          <Switch
            isChecked={toggleDocOnly}
            onChange={(e) => setToggleDocOnly(e.target.checked)}
          />
          <Text fontSize="sm">Only document</Text>
        </HStack>
      </HStack>

      {/* 3️⃣ show answer */}
      {answer && (
        <Box>
          <Text fontWeight="bold">Answer:</Text>
          <Text mb={2}>{answer}</Text>
          <Text fontWeight="bold">Sources:</Text>
          <UnorderedList>
            {sources.map((s, i) => (
              <ListItem key={i}>{s}</ListItem>
            ))}
          </UnorderedList>
        </Box>
      )}
    </Box>
  );
}
