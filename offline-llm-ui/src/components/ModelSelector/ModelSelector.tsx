import { Spinner, Select, Box, FormControl, FormLabel } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { listModels, type ModelInfo } from '../../api'
import { useChat } from '../../contexts/ChatContext'

export function ModelSelector() {
  const [models, setModels] = useState<ModelInfo[] | null>(null)
  const { model, setModel } = useChat()

  useEffect(() => {
    listModels().then((ms) => {
      setModels(ms)
      if (ms.length) setModel(ms[0].name)
    })
  }, [setModel])

  if (models === null) {
    return (
      <Box textAlign="center" py={1.5}>
        <Spinner size="sm" />
      </Box>
    )
  }

  return (
    <FormControl width="auto" display="flex" alignItems="center" mb={0}>
      <FormLabel htmlFor="model-select" mb="0" fontSize="sm" fontWeight="medium" color="text.secondary" pr={2}>
        Model:
      </FormLabel>
      <Select
        id="model-select"
        value={model}
        onChange={(e) => setModel(e.target.value)}
        size="sm"
        variant="outline"
        borderRadius="md"
        fontSize="sm"
        bg="bg.muted"
        _focus={{ borderColor: 'brand.accent' }}
        maxW="140px"
      >
        {models.map((m) => (
          <option key={m.name} value={m.name}>
            {m.name}
          </option>
        ))}
      </Select>
    </FormControl>
  )
}
