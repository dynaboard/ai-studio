import Fuse from 'fuse.js'
import { Check, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'

import { InfoMarker } from '@/components/info'
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
import {
  useChatManager,
  useCurrentModel,
  useCurrentThreadID,
} from '@/providers/chat/manager'
import { useThreadMessages } from '@/providers/history/manager'
import type { Model } from '@/providers/models/model-list'

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface ModelSwitcherProps extends PopoverTriggerProps {}

const fuseOptions = {
  keys: ['label'],
  threshold: 0.4,
}

type PickerModel = {
  label: string
  value: string
  modelPath: string
  quantization: string
}

type Option = {
  label: string
  models: PickerModel[]
}

export function ModelSwitcher({
  models,
  className,
}: ModelSwitcherProps & { models: Model[] }) {
  const [showDialog, setShowDialog] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const selectedModel = useCurrentModel()
  const chatManager = useChatManager()
  const currentThreadID = useCurrentThreadID()
  const messages = useThreadMessages(currentThreadID)

  const disableModelPicker = messages.length > 0

  const selectOptions: Option[] = React.useMemo(() => {
    return [
      {
        label: 'Open Source',
        models: [
          ...models.flatMap((model) =>
            model.files.map((file) => ({
              label: model.name,
              value: file.name,
              modelPath: file.name,
              quantization: file.quantization,
            })),
          ),
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
      models: PickerModel[]
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

  const selectedModelData = React.useMemo(() => {
    return allModels.find((model) => model.value === selectedModel)
  }, [selectedModel, allModels])

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <Popover
        open={open}
        onOpenChange={(open) =>
          disableModelPicker ? setOpen(false) : setOpen(open)
        }
      >
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label="Select a model"
              className={cn('flex w-[275px] justify-between', className)}
              disabled={disableModelPicker}
            >
              <p className="flex-1 truncate text-left">
                {selectedModelData?.label ?? 'Select a model'}
              </p>

              <Pill>{selectedModelData?.quantization}</Pill>

              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {disableModelPicker ? (
              <InfoMarker>
                <span className="break-words text-xs">
                  You&rsquo;re currently in a chat session. To change the model,
                  please start a new thread.
                </span>
              </InfoMarker>
            ) : null}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[275px] p-0">
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
                            chatManager.setModel(model.modelPath)
                            setOpen(false)
                          }}
                          className="gap-1 text-sm"
                        >
                          <div className="flex flex-1 justify-between">
                            <span>{model.label}</span>
                            <Pill>{model.quantization}</Pill>
                          </div>
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

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-secondary text-secondary-foreground mr-1 flex items-center justify-center whitespace-nowrap rounded-full px-2 py-1 text-xs leading-3">
      {children}
    </span>
  )
}
