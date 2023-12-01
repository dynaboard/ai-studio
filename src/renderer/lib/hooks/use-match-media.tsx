import { useEffect } from 'react'

export function useMatchMediaEffect(
  media: string,
  handler: (matches: boolean) => void,
) {
  useEffect(() => {
    const onMediaChange = (e: MediaQueryListEvent) => {
      handler(e.matches)
    }

    const queryList = window.matchMedia(media)

    if (queryList.matches) {
      handler(true)
    }

    queryList.addEventListener('change', onMediaChange)

    return () => {
      queryList.removeEventListener('change', onMediaChange)
    }
  }, [media, handler])
}
