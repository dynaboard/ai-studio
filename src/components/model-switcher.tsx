import Fuse from 'fuse.js'
import { Check, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Dialog } from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useAssistantManager } from '@/providers/local-assistant'
import type { Model } from '@/providers/models/model-list'

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface ModelSwitcherProps extends PopoverTriggerProps {}

const fuseOptions = {
  keys: ['value'],
  threshold: 0.4,
}

export function ModelSwitcher({
  models,
  className,
}: ModelSwitcherProps & { models: Model[] }) {
  const [showDialog, setShowDialog] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [selectedModel, setSelectedModel] = React.useState(models[0].name)
  const assistantManager = useAssistantManager()

  const selectOptions = React.useMemo(() => {
    return [
      {
        label: 'Open Source',
        models: [
          ...models.map((model) => ({
            label: model.name,
            value: model.name,
            modelPath: model.files[0].name,
          })),
        ],
      },
      // TODO: add openai call impl
      // {
      //   label: 'OpenAI',
      //   models: [
      //     {
      //       label: 'gpt-3.5-turbo-1106',
      //       value: 'gpt-3.5-turbo-1106',
      //     },
      //     {
      //       label: 'gpt-3.5-turbo',
      //       value: 'gpt-3.5-turbo',
      //     },
      //   ],
      // },
    ]
  }, [models])
  const [filteredItems, setFilteredItems] = React.useState<
    {
      label: string
      models: {
        label: string
        value: string
        modelPath: string
      }[]
    }[]
  >(selectOptions)

  const allModels = selectOptions.flatMap((group) => group.models)

  const handleFuzzySearch = React.useCallback(
    (newValue: string) => {
      setSearch(newValue)

      if (!newValue) {
        setFilteredItems(selectOptions)
        return
      }

      const fuse = new Fuse(allModels, fuseOptions)
      const results = fuse.search(newValue)
      const filteredOptions = selectOptions.map((group) => ({
        label: group.label,
        models: group.models.filter((model) =>
          results.some((result) => result.item.value === model.value),
        ),
      }))
      setFilteredItems(filteredOptions)
    },
    [allModels, selectOptions],
  )

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a model"
            className={cn('w-[240px] justify-between', className)}
          >
            <p className="truncate">{selectedModel}</p>
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0">
          <Command shouldFilter={false} loop>
            <CommandList>
              <CommandInput
                placeholder="Search model..."
                value={search}
                onValueChange={handleFuzzySearch}
              />
              {filteredItems.map(
                (group) =>
                  group.models.length > 0 && (
                    <CommandGroup key={group.label} heading={group.label}>
                      {group.models.map((model) => (
                        <CommandItem
                          key={model.value}
                          onSelect={() => {
                            setSelectedModel(model.value)
                            assistantManager.setModel(model.modelPath)
                            setOpen(false)
                          }}
                          className="text-sm"
                        >
                          {model.label}
                          <Check
                            className={cn(
                              'ml-auto h-4 w-4',
                              model.value === selectedModel
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ),
              )}
              {filteredItems.every((group) => group.models.length === 0) && (
                <CommandEmpty>No model found.</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </Dialog>
  )
}
