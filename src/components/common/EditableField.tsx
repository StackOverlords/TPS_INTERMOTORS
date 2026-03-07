import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/atoms/input";
import { Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EditableFieldProps {
  value: string | number;
  onSubmit: (value: string | number) => void;
  type?: "text" | "number" | "email" | "tel";
  numberProps?: {
    min?: number;
    max?: number;
    step?: number;
  };
  validate?: (value: string) => boolean;
  formatter?: (value: string | number) => string;
  parser?: (value: string) => string | number;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  inputClassName?: string;
  disabled?: boolean;
  showEditIcon?: boolean;
  showError?: boolean;
  onEditStart?: () => void;
  onEditCancel?: () => void;
  onEditConfirm?: (value: string | number) => void;
  autoSelect?: boolean;
  confirmOnEnter?: boolean;
  cancelOnEscape?: boolean;
  confirmOnBlur?: boolean;
  editOnFocus?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  focusNextOnEnter?: boolean;
  errorMessage?: string;

  // ─── Opt-in features — all undefined/false by default ────────────────────
  // EditableField, EditableQuantity and EditablePrice behave exactly as before
  // unless you explicitly pass these props at the usage site.

  /**
   * Prevents the mouse wheel from changing the numeric value.
   * Affects all OSes (Windows, Linux, macOS) — it's a browser behavior.
   * The input briefly loses focus so the browser ignores the wheel delta,
   * while the event still bubbles so the page scrolls normally.
   * Only has effect when type="number".
   * @default false
   */
  disableWheel?: boolean;

  /**
   * Prevents ArrowUp/ArrowDown from incrementing/decrementing the value.
   * Use alone to simply block the keys.
   * Use together with `columnKey` to also navigate between rows.
   * Only has effect when type="number".
   * @default false
   */
  disableArrowKeys?: boolean;

  /**
   * Opt-in row navigation with ArrowUp/ArrowDown.
   *
   * When provided, the input renders a `data-column="<columnKey>"` attribute
   * and arrow keys will jump to the prev/next visible input sharing that
   * attribute within the nearest ancestor matching:
   *   table | [role="grid"] | [data-editable-group]
   *
   * If no such ancestor exists the search falls back to the full document
   * (safe when there's only one input per column, e.g. standalone forms).
   *
   * Inputs hidden via display:none (e.g. inactive tabs) are automatically
   * excluded — only inputs where offsetParent !== null are considered.
   *
   * Also implies arrow value-change suppression (like disableArrowKeys).
   *
   * Leave undefined (default) to opt out entirely — no data-column attribute
   * is rendered and no navigation logic runs.
   *
   * @default undefined
   */
  columnKey?: string;
}

/**
 * Scrolls the row containing `input` into view, correctly accounting for a
 * sticky <thead> that would otherwise overlap the top of the row.
 *
 * Strategy:
 * 1. Find the nearest scrollable ancestor (overflow auto/scroll).
 * 2. Measure the sticky header height (if any) inside that container.
 * 3. If the row is hidden below the bottom → scroll down the minimum amount.
 * 4. If the row is hidden above the top (behind the header) → scroll up so the
 *    row sits just below the header, with a small extra gap for comfort.
 * 5. If the row is already fully visible → do nothing.
 */
function scrollRowIntoView(input: HTMLElement): void {
  const row = input.closest("tr") ?? input;

  // Find the nearest scrollable ancestor
  let scrollContainer: HTMLElement | null = null;
  let el = row.parentElement;
  while (el) {
    const { overflowY } = getComputedStyle(el);
    if (overflowY === "auto" || overflowY === "scroll") {
      scrollContainer = el;
      break;
    }
    el = el.parentElement;
  }

  // No scrollable container found — fall back to native scrollIntoView
  if (!scrollContainer) {
    row.scrollIntoView({ block: "nearest", inline: "nearest" });
    return;
  }

  // Measure sticky thead height inside the scroll container
  const thead = scrollContainer.querySelector("thead");
  const stickyOffset = thead ? thead.getBoundingClientRect().height : 0;

  const containerRect = scrollContainer.getBoundingClientRect();
  const rowRect = row.getBoundingClientRect();

  const effectiveTop = containerRect.top + stickyOffset; // visible area start
  const effectiveBottom = containerRect.bottom; // visible area end
  const gap = 4; // px of breathing room above the row

  if (rowRect.top < effectiveTop) {
    // Row is clipped at the top (behind the sticky header or above viewport)
    const scrollUp = effectiveTop - rowRect.top + gap;
    scrollContainer.scrollTop -= scrollUp;
  } else if (rowRect.bottom > effectiveBottom) {
    // Row is clipped at the bottom
    const scrollDown = rowRect.bottom - effectiveBottom + gap;
    scrollContainer.scrollTop += scrollDown;
  }
  // else: fully visible, do nothing
}

export const EditableField: React.FC<EditableFieldProps> = ({
  value,
  onSubmit,
  type = "text",
  numberProps,
  validate,
  formatter,
  parser,
  placeholder,
  className,
  buttonClassName,
  inputClassName,
  disabled = false,
  showEditIcon = true,
  showError = true,
  onEditStart,
  onEditCancel,
  onEditConfirm,
  autoSelect = true,
  confirmOnEnter = true,
  cancelOnEscape = true,
  confirmOnBlur = true,
  editOnFocus = true,
  inputRef: externalInputRef,
  focusNextOnEnter = false,
  errorMessage,
  disableWheel = false,
  disableArrowKeys = false,
  columnKey,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const setRefs = (el: HTMLInputElement | null) => {
    inputRef.current = el;

    if (typeof externalInputRef === "function") {
      externalInputRef(el);
    } else if (externalInputRef && typeof externalInputRef === "object") {
      (
        externalInputRef as React.MutableRefObject<HTMLInputElement | null>
      ).current = el;
    }
  };

  const getDisplayValue = (val: string | number): string => {
    if (formatter) return formatter(val);
    if (type === "number" && typeof val === "number") {
      return val.toFixed(numberProps?.step ? 2 : 0);
    }
    return val.toString();
  };

  const parseValue = (val: string): string | number => {
    if (parser) return parser(val);
    if (type === "number") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? value : parsed;
    }
    return val;
  };

  const validateValue = (val: string): boolean => {
    if (validate) return validate(val);
    if (type === "number") {
      const parsed = parseFloat(val);
      if (isNaN(parsed)) return false;
      if (numberProps?.min !== undefined && parsed < numberProps.min)
        return false;
      if (numberProps?.max !== undefined && parsed > numberProps.max)
        return false;
    }
    return true;
  };

  const startEditing = () => {
    if (disabled) return;
    setIsEditing(true);
    setTempValue(value.toString());
    setError("");
    onEditStart?.();
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setTempValue("");
    setError("");
    onEditCancel?.();
  };

  const confirmEditing = (shouldFocusNext = false) => {
    if (!validateValue(tempValue)) {
      setError("Valor inválido");
      return;
    }

    const parsedValue = parseValue(tempValue);
    setIsEditing(false);
    setError("");
    onEditConfirm?.(parsedValue);
    onSubmit(parsedValue);

    if (shouldFocusNext && focusNextOnEnter) {
      const currentElement = inputRef.current;
      if (currentElement) {
        const focusableInputs = Array.from(
          document.querySelectorAll<HTMLInputElement>(
            'input[type="number"]:not([disabled]), input[type="text"]:not([disabled])'
          )
        );
        const currentIndex = focusableInputs.indexOf(currentElement);
        const nextInput = focusableInputs[currentIndex + 1];

        if (nextInput) {
          setTimeout(() => {
            nextInput.focus();
            if (nextInput instanceof HTMLInputElement) nextInput.select();
          }, 0);
        } else {
          inputRef.current?.blur();
        }
      }
    } else {
      inputRef.current?.blur();
    }
  };

  /**
   * Navigates to the same-column input in the adjacent row.
   *
   * Only runs when columnKey is set (opt-in).
   *
   * Safety checks:
   * - Scoped to nearest table/grid/group to avoid cross-table jumps.
   * - Filters out inputs with offsetParent === null (hidden by display:none,
   *   e.g. an inactive tab panel) so we never land on an invisible input.
   *
   * Scroll behavior:
   * - After focusing, scrollIntoView({ block: "nearest" }) is called so the
   *   target row is always fully visible inside the scrollable table container.
   *   "nearest" means: do nothing if already visible, scroll the minimum amount
   *   if the row is clipped at the top or bottom. It never centers unnecessarily.
   */
  const navigateColumn = (direction: "up" | "down") => {
    const currentElement = inputRef.current;
    if (!currentElement || !columnKey) return;

    const container: Element | Document =
      currentElement.closest('table, [role="grid"], [data-editable-group]') ??
      document;

    const siblings = Array.from(
      container.querySelectorAll<HTMLInputElement>(
        `input[data-column="${columnKey}"]:not([disabled])`
      )
    ).filter((el) => el.offsetParent !== null);

    const currentIndex = siblings.indexOf(currentElement);
    if (currentIndex === -1) return;

    const targetIndex =
      direction === "down" ? currentIndex + 1 : currentIndex - 1;
    const targetInput = siblings[targetIndex];

    if (targetInput) {
      if (isEditing) confirmEditing(false);

      // Double rAF: waits for React to flush the re-render triggered by
      // confirmEditing/onSubmit before we focus + scroll. A single setTimeout(0)
      // or single rAF can still run before React commits the DOM update, which
      // causes the scroll position to shift after scrollIntoView and clip the row.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          targetInput.focus();
          targetInput.select();
          scrollRowIntoView(targetInput);
        });
      });
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (autoSelect) inputRef.current.select();
    }
  }, [isEditing, autoSelect]);

  // ─── Event handlers ───────────────────────────────────────────────────────

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    if (disableWheel && type === "number") {
      e.currentTarget.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const interceptArrows =
      type === "number" && (disableArrowKeys || !!columnKey);

    if (interceptArrows && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      if (columnKey) {
        navigateColumn(e.key === "ArrowDown" ? "down" : "up");
      }
      return;
    }

    if (confirmOnEnter && e.key === "Enter") {
      e.preventDefault();
      confirmEditing(true);
    }

    if (cancelOnEscape && e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
      inputRef.current?.blur();
    }
  };

  const handleBlur = () => {
    if (confirmOnBlur) confirmEditing();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempValue(e.target.value);
    setError("");
  };

  const handleInputClick = () => {
    if (!isEditing && editOnFocus) startEditing();
  };

  const handleInputFocus = () => {
    if (!isEditing && editOnFocus) startEditing();
  };

  const displayValue = getDisplayValue(value);

  return (
    <div className={cn("relative w-full", className, buttonClassName)}>
      <Input
        ref={setRefs}
        type={type}
        value={isEditing ? tempValue : displayValue}
        onChange={isEditing ? handleChange : undefined}
        onBlur={isEditing ? handleBlur : undefined}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        onClick={handleInputClick}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={!isEditing}
        {...(columnKey ? { "data-column": columnKey } : {})}
        className={cn(
          "cursor-pointer",
          !isEditing && "hover:bg-accent",
          isEditing && "cursor-text",
          error && "border-red-500 focus:border-red-500 ring-red-500",
          inputClassName
        )}
        {...(type === "number" && numberProps)}
      />
      {showEditIcon && !disabled && !isEditing && (
        <Edit3 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
      )}
      {showError && error && (
        <div className="mt-1 text-[10px] text-red-500">
          {errorMessage || error}
        </div>
      )}
    </div>
  );
};
