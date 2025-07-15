import { useState } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Button,
  Input,
  Progress,
  Text,
  VStack,
} from '@chakra-ui/react'
import { adminUploadPdfWithProgress } from '../../api'

interface AdminModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const [password, setPassword] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onUnlock = () => {
    if (password.trim()) setReady(true)
  }

  const onUpload = async () => {
    if (!file) return
    setUploading(true)
    setProgress(0)
    try {
      const resp = await adminUploadPdfWithProgress(file, password, setProgress)
      setStatus(`Indexed ${resp.filename}`)
    } catch (err: any) {
      setStatus(err.message)
    } finally {
      setUploading(false)
    }
  }

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
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg="brand.surface" color="text.secondary">
        <ModalHeader>Admin Panel</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box mt={10} display="flex" justifyContent="center">
            {content}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
