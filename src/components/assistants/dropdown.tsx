"use client";

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import type { Assistant } from "openai/resources/beta/assistants/assistants.mjs";
import { Button } from "@/ui/button";
import { Check, ChevronDown } from "lucide-react";
import Link from "next/link";

export function AssistantsDropdown({
  assistants,
  currentAssistantID,
}: {
  assistants: Assistant[];
  currentAssistantID?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex flex-row gap-4">
          <span>Select assistant</span>
          <ChevronDown size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {assistants.map((assistant) => {
          return (
            <DropdownMenuItem key={assistant.id} asChild>
              <Link
                href={`/?assistant=${assistant.id}`}
                className="flex justify-between items-center gap-2"
              >
                <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                  {assistant.name}
                </span>
                {currentAssistantID === assistant.id ? (
                  <Check size={16} />
                ) : null}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
