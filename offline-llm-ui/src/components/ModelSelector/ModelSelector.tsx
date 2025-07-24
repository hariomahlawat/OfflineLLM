import { Spinner, Select, Box, FormControl, FormLabel } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { listModels, type ModelInfo } from '../../api'
import { useChat } from '../../contexts/ChatContext'

export function ModelSelector() {
  const [models, setModels] = useState<ModelInfo[] | null>(null)
  const { model, setModel } = useChat()

  useEffect(() => {
    let cancelled = false

    async function load(attempt = 0): Promise<void> {
      try {
        const ms = await listModels()
        if (cancelled) return
        setModels(ms)
        if (ms.length) setModel(ms[0].name)
      } catch (err) {
        if (attempt < 3) {
          setTimeout(() => load(attempt + 1), (attempt + 1) * 1000)
        } else if (!cancelled) {
          console.error('listModels failed', err)
          setModels([])
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
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
