import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface AppSelectProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AppSelect({ options, value, onChange, placeholder = "Select an option", className }: AppSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-input/30 px-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:bg-input/50"
      >
        <span className={cn("truncate font-medium", !selectedOption && "text-muted-foreground")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("size-4 opacity-50 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-popover p-1 shadow-md animate-in fade-in zoom-in-95">
          <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
            {options.map((option) => (
              <button
                key={option.value}
                disabled={option.disabled}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent",
                  option.disabled && "opacity-50 cursor-not-allowed",
                  value === option.value && "bg-primary/20 text-primary font-semibold"
                )}
              >
                {value === option.value && (
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Check className="size-4" />
                  </span>
                )}
                <span className="truncate">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
