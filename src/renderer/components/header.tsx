import { type Model } from '@shared/model-list'

import { ParametersConfig } from './configuration'
import { ModelSwitcher } from './model-switcher'

export function Header({
  models,
  fileName,
}: {
  models: Model[]
  fileName?: string
}) {
  return (
    <div className="sticky top-0 flex h-16 w-full items-center gap-4 border-b bg-background/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full w-full items-center justify-between gap-4">
        <ModelSwitcher models={models} />

        <ParametersConfig fileName={fileName} />
      </div>
    </div>
  )
}
