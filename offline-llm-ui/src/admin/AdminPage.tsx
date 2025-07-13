import { useState } from "react";
import {
  Box,
  Button,
  Input,
  Progress,
  Text,
  VStack,
} from "@chakra-ui/react";
import { adminUploadPdf, adminUploadPdfWithProgress } from "../api";
import { AppHeader } from "../components/AppHeader/AppHeader";
import { AppFooter } from "../components/AppFooter/AppFooter";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onUnlock = () => {
    if (password.trim()) setReady(true);
  };

  const onUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const resp = await adminUploadPdfWithProgress(file, password, setProgress);
      setStatus(`Indexed ${resp.filename}`);
    } catch (err: any) {
      setStatus(err.message);
    } finally {
      setUploading(false);
    }
  };

  const content = !ready ? (
    <VStack spacing={4}>
      <Input
        type="password"
        placeholder="Admin password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        maxW="300px"
      />
      <Button onClick={onUnlock}>Enter</Button>
      {status && <Text color="red.500">{status}</Text>}
    </VStack>
  ) : (
    <VStack spacing={4}>
      <Input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        maxW="300px"
      />
      <Button onClick={onUpload} isDisabled={!file || uploading}>Upload</Button>
      {uploading && <Progress value={progress} width="100%" size="xs" />}
      {status && <Text>{status}</Text>}
    </VStack>
  );
  
  return (
    <Box h="100vh" w="100vw" display="flex" flexDirection="column">
      <Box as="header" position="sticky" top={0} zIndex={100} flexShrink={0}>
        <AppHeader />
      </Box>

      <Box
        flex="1"
        display="flex"
        justifyContent="center"
        alignItems="flex-start"
        overflowY="auto"
      >
        <Box mt={20}>{content}</Box>
      </Box>

      <Box as="footer" position="sticky" bottom={0} flexShrink={0}>
        <AppFooter />
      </Box>
    </Box>
  );
}

