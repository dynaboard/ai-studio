import React, { type RefObject, useRef } from 'react'

export function useEnterSubmit({
  onKeyDown,
}: {
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
} = {}): {
  formRef: RefObject<HTMLFormElement>
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
} {
  const formRef = useRef<HTMLFormElement>(null)

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (
        event.key === 'Enter' &&
        !event.shiftKey &&
        !event.nativeEvent.isComposing
      ) {
        formRef.current?.requestSubmit()
        event.preventDefault()
      }

      onKeyDown?.(event)
    },
    [formRef, onKeyDown],
  )

  return { formRef, onKeyDown: handleKeyDown }
}
