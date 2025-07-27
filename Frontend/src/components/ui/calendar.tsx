import * as React from "react";
import { DayPicker, DateRange, SelectRangeEventHandler } from "react-day-picker";
import "react-day-picker/dist/style.css";

export interface CalendarProps {
  selected?: Date | Date[] | DateRange;
  onSelect?: SelectRangeEventHandler;
  mode?: "single" | "multiple" | "range";
  disabled?: boolean;
  modifiers?: any;
  modifiersClassNames?: any;
  className?: string;
  fromDate?: Date;
  toDate?: Date;
  highlightedDates?: Date[];
}

export function Calendar({
  selected,
  onSelect,
  mode = "range",
  disabled = false,
  modifiers,
  modifiersClassNames,
  className = "",
  fromDate,
  toDate,
  highlightedDates = [],
}: CalendarProps) {
  return (
    <DayPicker
      mode={mode}
      selected={selected}
      onSelect={onSelect}
      disabled={disabled}
      modifiers={{ highlighted: highlightedDates, ...modifiers }}
      modifiersClassNames={{ highlighted: "bg-blue-200 text-blue-900", ...modifiersClassNames }}
      className={`rounded-md border bg-background p-3 ${className}`}
      fromDate={fromDate}
      toDate={toDate}
      showOutsideDays
      numberOfMonths={2}
      fixedWeeks
    />
  );
} 