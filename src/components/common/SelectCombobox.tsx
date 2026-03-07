import { cn } from "@/lib/utils";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Transition,
} from "@headlessui/react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDebounce } from "use-debounce";

interface Option {
  id: string | number;
  [key: string]: string | number | null | undefined;
}

interface ComboboxSelectProps {
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  optionTag: string; // Requerido para evitar errores
  allowClear?: boolean; // Nueva prop para permitir limpiar selección
  clearOnEmpty?: boolean; // Limpiar selección automáticamente cuando el texto se borra completamente
  disabled?: boolean;
  error?: boolean;
  enableAllOption?: boolean;
  isLoadingData?: boolean;
  searchPlaceholder?: string; //quitar este campo si no se usa
  onSearch?: (query: string) => void; // Función para realizar búsqueda externa
  isSearching?: boolean; // Estado de carga durante búsqueda
  searchDebounceMs?: number; // Tiempo de debounce para la búsqueda (por defecto 300ms)
  enableExternalSearch?: boolean; // Habilitar/deshabilitar búsqueda externa
  name?: string; // Nombre del input para formularios
  valueKey?: string; // Propiedad a usar como valor en lugar de "id" (por defecto: "id")
}

export function ComboboxSelect({
  value,
  onChange,
  options = [],
  placeholder = "Seleccionar...",
  className,
  optionTag,
  allowClear = false,
  clearOnEmpty = false,
  disabled = false,
  error = false,
  enableAllOption,
  isLoadingData = false,
  onSearch,
  isSearching = false,
  searchDebounceMs = 500,
  enableExternalSearch = false,
  name,
  valueKey = "id", // Por defecto usa "id" para mantener retrocompatibilidad
}: ComboboxSelectProps) {
  const internalValue = !value ? (enableAllOption ? "all" : "") : value;

  const [query, setQuery] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({
    showBelow: true,
    left: 0,
    top: 0,
    width: 0,
    maxHeight: 288,
  });

  const comboboxInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );
  const enterPressCountRef = useRef(0); // Contar cuántas veces se presiona Enter en secuencia
  const lastOpenStateRef = useRef(false); // Track del último estado de apertura

  const baseOptions = useMemo(() => {
    // Ordenar las opciones alfabéticamente por optionTag
    const sortedOptions = [...options].sort((a, b) => {
      const aValue = String(a[optionTag] || "").toLowerCase();
      const bValue = String(b[optionTag] || "").toLowerCase();
      return aValue.localeCompare(bValue);
    });

    return enableAllOption
      ? [{ id: "all", [optionTag]: "TODAS" }, ...sortedOptions]
      : sortedOptions;
  }, [enableAllOption, options, optionTag]);

  const [debouncedQuery] = useDebounce(query, searchDebounceMs);

  useEffect(() => {
    if (enableExternalSearch && onSearch) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, enableExternalSearch, onSearch]);

  const filteredOptions = useMemo(() => {
    if (enableExternalSearch) {
      return baseOptions;
    }

    return query === ""
      ? baseOptions
      : baseOptions.filter((option: Option) => {
          const optionValue = option[optionTag];
          return optionValue
            ?.toString()
            .toLowerCase()
            .includes(query.toLowerCase());
        });
  }, [enableExternalSearch, baseOptions, query, optionTag]);

  useEffect(() => {
    // Crear el contenedor del portal
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.zIndex = "9999";
    container.style.pointerEvents = "none";
    document.body.appendChild(container);
    setPortalContainer(container);

    return () => {
      document.body.removeChild(container);
    };
  }, []);

  const calculatePosition = () => {
    if (!comboboxInputRef.current) return;

    const inputRect = comboboxInputRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const spaceBelow = viewport.height - inputRect.bottom;
    const spaceAbove = inputRect.top;

    // Estimar altura del dropdown
    const estimatedDropdownHeight = Math.min(
      288,
      filteredOptions.length * 36 + 16
    );

    // Determinar si mostrar arriba o abajo
    // Priorizar mostrar abajo, pero si no hay espacio, mostrar arriba
    const showBelow =
      spaceBelow >= estimatedDropdownHeight || spaceBelow > spaceAbove;

    // Calcular altura máxima disponible
    const availableSpace = showBelow ? spaceBelow : spaceAbove;
    const maxHeight = Math.min(availableSpace - 8, 288); // 8px de margen

    // Calcular posición
    const left = inputRect.left;
    const top = showBelow
      ? inputRect.bottom + 4 // 4px de separación debajo
      : inputRect.top - maxHeight - 4; // 4px de separación arriba

    setDropdownPosition({
      showBelow,
      left,
      top,
      width: inputRect.width,
      maxHeight,
    });
  };

  useEffect(() => {
    calculatePosition();
  }, [filteredOptions.length]);

  useEffect(() => {
    const handleResize = () => calculatePosition();
    const handleScroll = () => calculatePosition();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true); // true para capturar scroll en cualquier contenedor

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [filteredOptions.length]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setQuery(newQuery);

    // Si clearOnEmpty está habilitado y el query está vacío, limpiar selección
    if (clearOnEmpty && newQuery === "") {
      onChange("");
      if (enableExternalSearch && onSearch) {
        onSearch("");
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setQuery("");

    if (enableExternalSearch && onSearch) {
      onSearch("");
    }
  };

  const selectedOption = useMemo(() => {
    return (
      // Busca por valueKey si está definido, con fallback a "id" para retrocompatibilidad
      baseOptions.find(
        (opt) => String(opt[valueKey] ?? opt.id) === internalValue.toString()
      ) ?? null
    );
  }, [internalValue, baseOptions, valueKey]);

  // Validación temprana
  if (!optionTag) {
    console.warn("ComboboxSelect: optionTag is required");
    return null;
  }

  const showLoading = isLoadingData || (enableExternalSearch && isSearching);

  const handleComboboxChange = useCallback(
    (selectedValue: string) => {
      if (selectedValue !== null) {
        // Si el valor seleccionado es igual al valor actual, forzar un "cambio"
        // limpiando primero y luego volviendo a setear el mismo valor
        if (selectedValue === internalValue.toString()) {
          // Limpiar temporalmente
          onChange("");
          // Luego volver a setear el valor en el siguiente tick
          setTimeout(() => {
            onChange(selectedValue);
          }, 0);
        } else {
          // Valor diferente, cambio normal
          onChange(selectedValue);
        }

        // Incrementar el contador para indicar que acabamos de seleccionar
        enterPressCountRef.current = 2;
      }
      setQuery("");

      if (enableExternalSearch && onSearch) {
        onSearch("");
      }
    },
    [onChange, enableExternalSearch, onSearch, internalValue]
  );

  return (
    <Combobox
      value={internalValue.toString()}
      onChange={handleComboboxChange}
      disabled={disabled}
    >
      {({ open }) => {
        // Detectar cambios en el estado de apertura
        if (lastOpenStateRef.current !== open) {
          lastOpenStateRef.current = open;

          // Si se cerró el dropdown y teníamos 2 Enters (abrió y seleccionó)
          if (!open && enterPressCountRef.current === 2) {
            // Navegar inmediatamente al siguiente campo
            setTimeout(() => {
              if (!comboboxInputRef.current) return;

              const container =
                comboboxInputRef.current.closest("form") || document;
              const allInputs = Array.from(
                container.querySelectorAll<HTMLElement>(
                  'input:not([type="hidden"]):not([disabled]):not([type="file"]):not([type="submit"]):not([type="reset"]), ' +
                    "textarea:not([disabled]), " +
                    'button[type="submit"]:not([disabled])'
                )
              );

              const focusableElements = allInputs.filter((el) => {
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
              });

              const currentIndex = focusableElements.indexOf(
                comboboxInputRef.current
              );
              if (
                currentIndex !== -1 &&
                currentIndex < focusableElements.length - 1
              ) {
                const nextElement = focusableElements[currentIndex + 1];
                nextElement?.focus();
                // Si es un input de texto, seleccionar todo el contenido
                if (
                  nextElement instanceof HTMLInputElement &&
                  (nextElement.type === "text" ||
                    nextElement.type === "number" ||
                    nextElement.type === "date")
                ) {
                  nextElement.select();
                }
              }

              // Resetear contador
              enterPressCountRef.current = 0;
            }, 0);
          }
        }

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") {
            // Incrementar contador
            enterPressCountRef.current++;

            // Si el dropdown está abierto, dejar que Headless UI maneje la selección
            if (open) {
              return;
            }

            // Si está cerrado y es el primer Enter, dejar que se abra
            if (enterPressCountRef.current === 1) {
              return;
            }

            // Si llegamos aquí y el contador es > 1, prevenir más aperturas
            e.preventDefault();
            e.stopPropagation();
          } else {
            // Cualquier otra tecla resetea el contador
            enterPressCountRef.current = 0;
          }
        };

        return (
          <div className={cn("relative", className)}>
            <div className="relative w-full">
              <ComboboxButton className="w-full" disabled={disabled}>
                <ComboboxInput
                  ref={comboboxInputRef}
                  name={name}
                  placeholder={placeholder}
                  className={cn(
                    "flex h-8 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    error
                      ? "border-red-500 focus:ring-red-500"
                      : "border-input",
                    "pr-10"
                  )}
                  displayValue={() =>
                    String(
                      selectedOption?.[optionTag] ||
                        (enableAllOption ? "TODAS" : "")
                    )
                  }
                  onChange={handleInputChange}
                  onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                    // Seleccionar todo el texto cuando el input recibe el foco
                    e.currentTarget.select();
                  }}
                  onClick={(e: React.MouseEvent<HTMLInputElement>) => {
                    // Seleccionar todo el texto cuando se hace click
                    e.currentTarget.select();
                  }}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                />
              </ComboboxButton>

              {/* Ícono chevron o loading durante búsqueda */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                {enableExternalSearch && isSearching ? (
                  <Loader2 className="h-4 w-4 opacity-50 animate-spin" />
                ) : (
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 opacity-50 transition-transform duration-200",
                      open ? "rotate-180" : "",
                      disabled ? "opacity-25" : ""
                    )}
                  />
                )}
              </div>
            </div>

            {portalContainer &&
              open &&
              createPortal(
                <Transition
                  show={open}
                  as="div"
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                  afterLeave={() => {
                    setQuery("");
                    // Limpiar búsqueda externa al cerrar
                    if (enableExternalSearch && onSearch) {
                      onSearch("");
                    }
                  }}
                  beforeEnter={calculatePosition}
                >
                  <ComboboxOptions
                    ref={dropdownRef}
                    static
                    className="overflow-auto rounded-md bg-popover p-1 text-sm shadow-lg border border-border focus:outline-none"
                    style={{
                      position: "fixed",
                      left: `${dropdownPosition.left}px`,
                      top: `${dropdownPosition.top}px`,
                      width: `${dropdownPosition.width}px`,
                      maxHeight: `${dropdownPosition.maxHeight}px`,
                      pointerEvents: "auto",
                    }}
                  >
                    {showLoading ? (
                      <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground text-center flex justify-center items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        {enableExternalSearch && isSearching
                          ? "Buscando..."
                          : "Cargando datos"}
                      </div>
                    ) : filteredOptions.length === 0 ? (
                      <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground text-center">
                        {query ? (
                          <>No se encontraron resultados para "{query}"</>
                        ) : (
                          "No hay opciones disponibles"
                        )}
                      </div>
                    ) : (
                      filteredOptions.map((option: Option) => (
                        <ComboboxOption
                          key={String(option.id)}
                          value={String(option[valueKey] ?? option.id)}
                          className={({ focus }) =>
                            cn(
                              "relative cursor-pointer select-none py-1.5 pl-10 pr-4 transition-colors rounded",
                              focus && "bg-accent text-accent-foreground"
                            )
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={cn(
                                  "block truncate",
                                  selected ? "font-medium" : "font-normal"
                                )}
                              >
                                {option[optionTag]}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                  <Check className="h-4 w-4" />
                                </span>
                              )}
                            </>
                          )}
                        </ComboboxOption>
                      ))
                    )}
                  </ComboboxOptions>
                </Transition>,
                portalContainer
              )}
          </div>
        );
      }}
    </Combobox>
  );
}
