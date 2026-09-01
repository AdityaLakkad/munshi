"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface EntityOption {
  id: string;
  name: string;
}

interface EntityComboboxProps {
  searchEndpoint: string;
  value: string | null;
  selectedOption?: EntityOption | null;
  onChange: (id: string | null, entity: EntityOption | null) => void;
  placeholder?: string;
  emptyText?: string;
}

/**
 * Shared autocomplete/combobox pattern for any field that references another
 * entity (CLAUDE.md rule 5) — backed by a `/search/*` endpoint, debounced ~250ms.
 * Fully controlled: pass `selectedOption` so a caller (e.g. quick-add) can set
 * the display label without a round-trip search.
 */
export function EntityCombobox({
  searchEndpoint,
  value,
  selectedOption = null,
  onChange,
  placeholder = "Search...",
  emptyText = "No results found.",
}: EntityComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [options, setOptions] = React.useState<EntityOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    const timeout = setTimeout(() => {
      apiFetch<EntityOption[]>(`${searchEndpoint}?q=${encodeURIComponent(query)}`)
        .then(setOptions)
        .catch(() => setOptions([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [open, query, searchEndpoint]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedOption ? selectedOption.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder={placeholder} value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>{loading ? "Searching..." : emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.id}
                  onSelect={() => {
                    onChange(option.id, option);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option.id ? "opacity-100" : "opacity-0")} />
                  {option.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
