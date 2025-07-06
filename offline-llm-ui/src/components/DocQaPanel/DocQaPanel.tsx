import { useState } from 'react';
import {
  Box,
  Button,
  Input,
  Textarea,
  Spinner,
  Alert,
  AlertIcon,
  VStack,
  UnorderedList,
  ListItem,
} from '@chakra-ui/react';
import { useChat } from '../../contexts/ChatContext';
import { uploadPdf, docQa } from '../../api';

export function DocQaPanel() {
  const { sessionId } = useChat();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ingestedChunks, setIngestedChunks] = useState<number | null>(null);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const resp = await uploadPdf(sessionId, file);
      setIngestedChunks(resp.chunks_indexed);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!question) return;
    setError(null);
    setLoading(true);
    try {
      const { answer: ans, sources } = await docQa(question);
      setAnswer(ans);
      setSources(sources);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <VStack align="stretch" spacing={4} p={4} borderWidth="1px" borderRadius="md">
      <Box>
        <Input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <Button
          mt={2}
          onClick={handleUpload}
          isLoading={uploading}
          isDisabled={!file || uploading}
          colorScheme="blue"
        >
          Upload PDF
        </Button>
        {ingestedChunks !== null && (
          <Alert status="success" mt={2}>
            <AlertIcon />
            Indexed {ingestedChunks} chunks.
          </Alert>
        )}
      </Box>

      {ingestedChunks !== null && (
        <>
          <Textarea
            placeholder="Ask a question about the uploaded document..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <Button onClick={handleAsk} isLoading={loading} colorScheme="teal">
            Ask Document
          </Button>
        </>
      )}

      {loading && <Spinner />}

      {error && (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {answer && (
        <Box>
          <Box fontWeight="bold" mb={2}>
            Answer:
          </Box>
          <Box mb={4}>{answer}</Box>

          <Box fontWeight="bold">Sources:</Box>
          <UnorderedList>
            {sources.map((src, i) => (
              <ListItem key={i}>{src}</ListItem>
            ))}
          </UnorderedList>
        </Box>
      )}
    </VStack>
  );
}
