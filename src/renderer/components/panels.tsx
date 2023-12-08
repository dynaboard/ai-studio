import { motion, useMotionValue } from 'framer-motion'
import React, { useEffect, useState } from 'react'

type ResizablePanelProps = {
  defaultWidth: number
  maxWidth: number
  minWidth: number
  isClosed?: boolean
  children?: React.ReactNode
}

export function ResizablePanel({
  defaultWidth,
  maxWidth,
  minWidth,
  isClosed = false,
  children,
}: ResizablePanelProps) {
  const [currentWidth, setCurrentWidth] = useState(defaultWidth)
  const width = useMotionValue(defaultWidth)

  useEffect(() => {
    if (isClosed) {
      setCurrentWidth(0)
      width.set(0)
    } else {
      setCurrentWidth(defaultWidth)
      width.set(defaultWidth)
    }
  }, [isClosed, defaultWidth, width])

  return (
    <motion.div className="relative h-full" style={{ width }}>
      {children}
      {!isClosed ? (
        <>
          <motion.div
            className="resizer peer absolute top-0 z-50 ml-[-4px] h-full w-[7px] cursor-[ew-resize]"
            drag="x"
            dragConstraints={{
              left: 0,
              right: 200,
            }}
            dragSnapToOrigin={true}
            dragElastic={0}
            dragMomentum={false}
            style={{
              left: width,
            }}
            onDragStart={() => {
              document.body.style.cursor = 'ew-resize'
            }}
            onDrag={(_e, info) => {
              const newWidth = currentWidth + info.offset.x
              if (newWidth > maxWidth || newWidth < minWidth) {
                return
              }

              width.set(currentWidth + info.offset.x)
            }}
            onDragEnd={(_e, _info) => {
              setCurrentWidth(width.get())
              document.body.style.cursor = 'default'
            }}
          />
          <div className="absolute right-0 top-0 h-full w-[1px] bg-border peer-hover:bg-primary/20" />
        </>
      ) : null}
    </motion.div>
  )
}
