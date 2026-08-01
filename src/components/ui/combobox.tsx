"use client";

import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface ComboboxProps {
  items: ComboboxOption[];
  value?: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  items,
  value,
  onValueChange,
  placeholder = "Search…",
  emptyMessage = "No results found.",
  className,
  disabled,
}: ComboboxProps) {
  const selected = items.find((item) => item.value === value) ?? null;

  // Search matches the label AND the description (e.g. employee code / email,
  // catalog code) — not just the visible label — so typing a code or email
  // finds the right item too.
  function matchesQuery(item: unknown, query: string) {
    const option = item as ComboboxOption;
    if (!query) return true;
    const haystack = `${option.label} ${option.description ?? ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  }

  return (
    <ComboboxPrimitive.Root
      items={items}
      value={selected}
      onValueChange={(next) => onValueChange((next as ComboboxOption | null)?.value ?? null)}
      isItemEqualToValue={(item, val) =>
        (item as ComboboxOption)?.value === (val as ComboboxOption | null)?.value
      }
      filter={matchesQuery}
      disabled={disabled}
    >
      <ComboboxPrimitive.InputGroup
        className={cn(
          "relative flex h-9 w-full items-center rounded-lg border border-input bg-transparent text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
          className,
        )}
      >
        <ComboboxPrimitive.Input
          placeholder={placeholder}
          className="h-full w-full min-w-0 border-0 bg-transparent py-1 pr-14 pl-2.5 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="absolute right-1 flex items-center gap-0.5 text-muted-foreground">
          <ComboboxPrimitive.Clear
            className="flex size-6 items-center justify-center rounded-md outline-none hover:bg-accent hover:text-accent-foreground"
            aria-label="Clear selection"
          >
            <XIcon className="size-3.5" />
          </ComboboxPrimitive.Clear>
          <ComboboxPrimitive.Trigger
            className="flex size-6 items-center justify-center rounded-md outline-none hover:bg-accent hover:text-accent-foreground"
            aria-label="Open list"
          >
            <ChevronsUpDownIcon className="size-3.5" />
          </ComboboxPrimitive.Trigger>
        </div>
      </ComboboxPrimitive.InputGroup>

      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner className="isolate z-50 outline-none" sideOffset={4}>
          <ComboboxPrimitive.Popup className="w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <ComboboxPrimitive.Empty className="py-6 text-center text-sm text-muted-foreground data-empty:hidden">
              {emptyMessage}
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List className="max-h-72 overflow-y-auto overscroll-contain p-1">
              {(item: ComboboxOption) => (
                <ComboboxPrimitive.Item
                  key={item.value}
                  value={item}
                  className="relative flex cursor-default items-center gap-2 rounded-md py-1.5 pr-7 pl-2 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  {item.icon}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{item.label}</span>
                    {item.description ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    ) : null}
                  </div>
                  <ComboboxPrimitive.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center">
                    <CheckIcon className="size-3.5" />
                  </ComboboxPrimitive.ItemIndicator>
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  );
}
