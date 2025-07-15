import { useRef, useState } from 'react'
import { IconButton } from '@chakra-ui/react'
import { FiMic, FiSquare } from 'react-icons/fi'
import { speechToText } from '../../api'

interface Props {
  onResult: (text: string) => void
  size?: string
}

export default function SpeechButton({ onResult, size = 'md' }: Props) {
  const [recording, setRecording] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  const toggle = async () => {
    if (recording) {
      recorderRef.current?.stop()
      setRecording(false)
      return
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const rec = new MediaRecorder(stream)
    chunksRef.current = []
    rec.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data)
    }
    rec.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const file = new File([blob], 'speech.webm', { type: 'audio/webm' })
      try {
        const { text } = await speechToText(file)
        onResult(text)
      } catch (err) {
        console.error(err)
      } finally {
        stream.getTracks().forEach((t) => t.stop())
      }
    }
    recorderRef.current = rec
    rec.start()
    setRecording(true)
  }

  return (
    <IconButton
      aria-label="Record"
      icon={recording ? <FiSquare /> : <FiMic />}
      onClick={toggle}
      variant="ghost"
      colorScheme="brand"
      borderRadius="full"
      size={size as any}
    />
  )
}
