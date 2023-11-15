import { Model } from '@/providers/models'

import { ModelSwitcher } from './model-switcher'

export function Header({ models }: { models: Model[] }) {
  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <ModelSwitcher models={models} />
    </div>
  )
}
