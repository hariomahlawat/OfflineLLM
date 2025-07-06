// src/components/ModelSelector/ModelSelector.tsx

import { Select } from '@chakra-ui/react'
import { useChat } from '../../contexts/ChatContext'

export function ModelSelector() {
  const { models, model, setModel } = useChat()

  return (
    <Select value={model} onChange={e => setModel(e.target.value)}>
      {models.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </Select>
  )
}

