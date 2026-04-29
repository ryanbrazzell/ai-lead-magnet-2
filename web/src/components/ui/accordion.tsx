"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type AccordionContextValue = {
  openItems: string[];
  toggleItem: (value: string) => void;
  isOpen: (value: string) => boolean;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);
const AccordionItemContext = React.createContext<{ value: string } | null>(null);

export function Accordion({
  children,
  type = "single",
  defaultValue,
  className,
}: {
  children: React.ReactNode;
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  className?: string;
}) {
  const [openItems, setOpenItems] = React.useState<string[]>(
    Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : []
  );

  const value = React.useMemo<AccordionContextValue>(
    () => ({
      openItems,
      toggleItem: (itemValue) =>
        setOpenItems((prev) => {
          const exists = prev.includes(itemValue);
          if (type === "single") {
            return exists ? [] : [itemValue];
          }
          return exists ? prev.filter((entry) => entry !== itemValue) : [...prev, itemValue];
        }),
      isOpen: (itemValue) => openItems.includes(itemValue),
    }),
    [openItems, type]
  );

  return (
    <AccordionContext.Provider value={value}>
      <div className={cn("space-y-3", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div className={cn("rounded-[var(--radius-lg)] border border-border bg-white", className)}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(AccordionContext);
  const item = React.useContext(AccordionItemContext);
  if (!context || !item) throw new Error("AccordionTrigger must be used within AccordionItem");

  const open = context.isOpen(item.value);

  return (
    <button
      type="button"
      onClick={() => context.toggleItem(item.value)}
      className={cn(
        "flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-primary",
        className
      )}
    >
      <span>{children}</span>
      <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
    </button>
  );
}

export function AccordionContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(AccordionContext);
  const item = React.useContext(AccordionItemContext);
  if (!context || !item) throw new Error("AccordionContent must be used within AccordionItem");

  if (!context.isOpen(item.value)) return null;

  return (
    <div className={cn("px-5 pb-5 pt-0 text-sm leading-relaxed text-[color:var(--color-secondary)]", className)}>
      {children}
    </div>
  );
}
