import { Spinner, Select, Box, FormControl, FormLabel } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { listModels, type ModelInfo } from '../../api'

export function ModelSelector() {
  const [models, setModels] = useState<ModelInfo[] | null>(null)
  const [selected, setSelected] = useState<string>('')

  useEffect(() => {
    listModels().then((ms) => {
      setModels(ms)
      if (ms.length) setSelected(ms[0].name)
    })
  }, [])

  if (models === null) {
    return (
      <Box textAlign="center" py={1.5}>
        <Spinner size="sm" />
      </Box>
    )
  }

  return (
    <FormControl width="auto" display="flex" alignItems="center" mb={0}>
      <FormLabel htmlFor="model-select" mb="0" fontSize="sm" fontWeight="medium" color="gray.100" pr={2}>
        Model:
      </FormLabel>
      <Select
        id="model-select"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        size="sm"
        variant="outline"
        borderRadius="md"
        fontSize="sm"
        bg="gray.50"
        _focus={{ borderColor: "blue.400" }}
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
