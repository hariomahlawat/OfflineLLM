import { useEffect, useState } from "react"
import { Select } from "@chakra-ui/react"
import { listModels, type ModelInfo } from "../api"  
import { useChat } from "../contexts/ChatContext"

export function ModelSelector() {
  const { model, setModel } = useChat()
  const [models, setModels] = useState<ModelInfo[]>([])

  useEffect(() => {
    listModels().then(setModels).catch(console.error)
  }, [])

  return (
    <Select
      value={model}
      onChange={(e) => setModel(e.target.value)}
      maxW="300px"
    >
      {models.map((m) => (
        <option key={m.name} value={m.name}>
          {m.name}
        </option>
      ))}
    </Select>
  )
}
