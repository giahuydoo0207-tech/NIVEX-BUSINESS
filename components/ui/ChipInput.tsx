"use client";

import { useState, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { X } from "lucide-react";

export type ChipInputProps = {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  prefix?: string;
  maxItems?: number;
  normalizeItem?: (raw: string) => string;
  validateItem?: (item: string, current: string[]) => string | null;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
};

export function ChipInput({
  values,
  onChange,
  placeholder = "Nhập và nhấn Enter...",
  prefix = "",
  maxItems,
  normalizeItem,
  validateItem,
  onError,
  disabled = false,
  className = "",
}: ChipInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAddChip() {
    const raw = input.trim();
    if (!raw) return;

    const normalized = normalizeItem ? normalizeItem(raw) : raw;
    if (!normalized) return;

    if (maxItems !== undefined && values.length >= maxItems) {
      onError?.(`Chỉ được thêm tối đa ${maxItems} mục.`);
      return;
    }

    if (validateItem) {
      const error = validateItem(normalized, values);
      if (error) {
        onError?.(error);
        return;
      }
    } else if (values.includes(normalized)) {
      onError?.("Mục này đã được thêm.");
      return;
    }

    onError?.("");
    onChange([...values, normalized]);
    setInput("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      handleAddChip();
    } else if (event.key === "Backspace" && input === "" && values.length > 0) {
      event.preventDefault();
      onChange(values.slice(0, -1));
      onError?.("");
    }
  }

  function handleRemoveChip(index: number, event?: MouseEvent) {
    event?.stopPropagation();
    onChange(values.filter((_, i) => i !== index));
    onError?.("");
    inputRef.current?.focus();
  }

  function handleContainerClick() {
    inputRef.current?.focus();
  }

  return (
    <div
      className={`chip-input-container ${disabled ? "disabled" : ""} ${className}`.trim()}
      onClick={handleContainerClick}
    >
      <div className="chip-list">
        {values.map((item, index) => (
          <span className="chip-badge" key={`${item}-${index}`}>
            <span className="chip-text">
              {prefix}
              {item}
            </span>
            {!disabled && (
              <button
                type="button"
                className="chip-remove"
                aria-label={`Xóa ${prefix}${item}`}
                onClick={(e) => handleRemoveChip(index, e)}
              >
                <X size={12} />
              </button>
            )}
          </span>
        ))}
        {!disabled && (!maxItems || values.length < maxItems) && (
          <input
            ref={inputRef}
            type="text"
            className="chip-native-input"
            value={input}
            placeholder={values.length === 0 ? placeholder : ""}
            onChange={(e) => {
              setInput(e.target.value);
              onError?.("");
            }}
            onKeyDown={handleKeyDown}
          />
        )}
      </div>
    </div>
  );
}
