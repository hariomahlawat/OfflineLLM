import { useState } from "react";
import { Button, Input, Text, VStack } from "@chakra-ui/react";
import { adminUploadPdf } from "../api";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const onUnlock = () => {
    if (password.trim()) setReady(true);
  };

  const onUpload = async () => {
    if (!file) return;
    try {
      const resp = await adminUploadPdf(file, password);
      setStatus(`Indexed ${resp.filename}`);
    } catch (err: any) {
      setStatus(err.message);
    }
  };

  if (!ready) {
    return (
      <VStack mt={20} spacing={4}>
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
    );
  }

  return (
    <VStack mt={20} spacing={4}>
      <Input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        maxW="300px"
      />
      <Button onClick={onUpload} isDisabled={!file}>Upload</Button>
      {status && <Text>{status}</Text>}
    </VStack>
  );
}

