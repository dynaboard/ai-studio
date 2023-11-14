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
import { Model } from '@/providers/models'

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface ModelSwitcherProps extends PopoverTriggerProps {}

export function ModelSwitcher({
  models,
  className,
}: ModelSwitcherProps & { models: Model[] }) {
  const [showDialog, setShowDialog] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  const selectOptions = React.useMemo(() => {
    return [
      {
        label: 'Open Source',
        models: [
          ...models.map((model) => ({
            label: model.name,
            value: model.name,
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
  const [selectedModel, setSelectedModel] = React.useState(
    selectOptions[0].models[0].value,
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
          <Command>
            <CommandList>
              <CommandInput placeholder="Search model..." />
              <CommandEmpty>No model found.</CommandEmpty>
              {selectOptions.map((group) => (
                <CommandGroup key={group.label} heading={group.label}>
                  {group.models.map((model) => (
                    <CommandItem
                      key={model.value}
                      onSelect={() => {
                        setSelectedModel(model.value)
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
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </Dialog>
  )
}
