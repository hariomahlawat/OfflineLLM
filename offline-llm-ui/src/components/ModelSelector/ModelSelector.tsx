import { Spinner, Select, Box } from '@chakra-ui/react'
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
      <Box textAlign="center" py={2}>
        <Spinner />
      </Box>
    )
  }

  return (
    <Select
      value={selected}
      onChange={(e) => setSelected(e.target.value)}
    >
      {models.map((m) => (
        <option key={m.name} value={m.name}>
          {m.name}
        </option>
      ))}
    </Select>
  )
}
