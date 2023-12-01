import { useEffect, useState } from 'react'

export function useDragAndDrop({
  fileTypes,
  onDrop,
}: {
  fileTypes?: string[]
  onDrop: (files: File[]) => void
}) {
  const [draggedOver, setDraggedOver] = useState(false)

  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const handleDragOver = (event: DragEvent) => {
      event.preventDefault()
      setDraggedOver(true)
    }

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault()
      setDraggedOver(false)
    }

    const handleDrop = (event: DragEvent) => {
      event.preventDefault()

      setDraggedOver(false)

      let files = Array.from(event.dataTransfer?.files ?? [])
      if (files.length > 0) {
        // eslint-disable-next-line no-console
        console.log('Handling dropped files', {
          names: files.map((file) => file.name),
        })
        if (fileTypes) {
          files = files.filter((file) => fileTypes.includes(file.type))
        }
        onDrop(files)
      }
    }

    targetElement?.addEventListener('dragover', handleDragOver)
    targetElement?.addEventListener('dragleave', handleDragLeave)
    targetElement?.addEventListener('drop', handleDrop)

    return () => {
      targetElement?.removeEventListener('dragover', handleDragOver)
      targetElement?.removeEventListener('dragleave', handleDragLeave)
      targetElement?.removeEventListener('drop', handleDrop)
    }
  }, [targetElement, onDrop, fileTypes])

  return {
    draggedOver,
    setTargetElement,
  }
}
