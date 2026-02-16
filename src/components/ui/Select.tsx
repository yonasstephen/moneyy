"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? placeholder;

  const close = useCallback(() => {
    setOpen(false);
    setFocusIndex(-1);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open, close]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusIndex >= 0 && listRef.current) {
      const item = listRef.current.children[focusIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [focusIndex]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        setFocusIndex(options.findIndex((o) => o.value === value));
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (focusIndex >= 0) {
          onChange(options[focusIndex].value);
          close();
        }
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (open) {
            close();
          } else {
            setOpen(true);
            setFocusIndex(options.findIndex((o) => o.value === value));
          }
        }}
        onKeyDown={handleKeyDown}
        className="flex w-full items-center justify-between gap-2 rounded border border-border bg-card px-3 py-1.5 text-sm text-left"
      >
        <span className={value === "" && placeholder ? "text-muted" : ""}>
          {selectedLabel}
        </span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full min-w-[8rem] overflow-auto rounded border border-border bg-card py-1 shadow-lg"
        >
          {options.map((option, i) => (
            <li
              key={option.value}
              onClick={() => {
                onChange(option.value);
                close();
              }}
              className={`cursor-pointer px-3 py-1.5 text-sm transition-colors ${
                i === focusIndex ? "bg-accent-light" : ""
              } ${option.value === value ? "font-medium" : "text-muted"} hover:bg-accent-light`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
