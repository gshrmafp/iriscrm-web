"use client";

import { useState } from "react";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface DateRangeValue {
  dateFrom?: string;
  dateTo?: string;
}

type Preset = "week" | "month" | "quarter" | "year";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
];

function presetToRange(preset: Preset): DateRangeValue {
  const now = new Date();
  let start: Date;
  switch (preset) {
    case "week": {
      const day = now.getDay();
      const sinceMonday = (day + 6) % 7; // Mon=0 ... Sun=6
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - sinceMonday);
      break;
    }
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarter": {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), quarterStartMonth, 1);
      break;
    }
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
  }
  return { dateFrom: start.toISOString(), dateTo: now.toISOString() };
}

// Quick presets + a bank-statement-style custom From/To range. Emits ISO
// date strings; an empty value means "all time" (this component is purely
// additive — every caller already treats a missing dateFrom/dateTo as no filter).
export function DateRangeFilter({
  value,
  onChange,
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}) {
  const [activePreset, setActivePreset] = useState<Preset | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  function selectPreset(preset: Preset) {
    setActivePreset(preset);
    setShowCustom(false);
    onChange(presetToRange(preset));
  }

  function toggleCustom() {
    setActivePreset(null);
    setShowCustom((prev) => !prev);
  }

  function applyCustom() {
    setActivePreset(null);
    onChange({
      dateFrom: customFrom ? new Date(customFrom).toISOString() : undefined,
      dateTo: customTo ? new Date(`${customTo}T23:59:59`).toISOString() : undefined,
    });
  }

  function clearAll() {
    setActivePreset(null);
    setShowCustom(false);
    setCustomFrom("");
    setCustomTo("");
    onChange({});
  }

  const hasFilter = !!(value.dateFrom || value.dateTo);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((preset) => (
        <Button
          key={preset.value}
          type="button"
          size="sm"
          variant={activePreset === preset.value ? "default" : "outline"}
          onClick={() => selectPreset(preset.value)}
        >
          {preset.label}
        </Button>
      ))}
      <Button type="button" size="sm" variant={showCustom ? "default" : "outline"} onClick={toggleCustom}>
        <CalendarRange className="size-3.5" />
        Custom
      </Button>
      {hasFilter ? (
        <Button type="button" size="sm" variant="ghost" onClick={clearAll}>
          Clear
        </Button>
      ) : null}
      {showCustom ? (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5">
          <Input
            type="date"
            value={customFrom}
            onChange={(event) => setCustomFrom(event.target.value)}
            className="h-7 w-[9.5rem]"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            value={customTo}
            onChange={(event) => setCustomTo(event.target.value)}
            className="h-7 w-[9.5rem]"
          />
          <Button type="button" size="sm" onClick={applyCustom} disabled={!customFrom && !customTo}>
            Apply
          </Button>
        </div>
      ) : null}
    </div>
  );
}
