import { useState, Fragment, useRef, useMemo, useEffect } from 'react'
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Transition } from '@headlessui/react'
import { Check, ChevronDown, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '../atoms/button'

interface Option {
    id: string | number
    [key: string]: string | number | null | undefined
}

interface MetaData {
    current_page: number
    last_page: number
    total: number
    per_page: number
}

interface PaginatedComboboxProps<T extends Record<string, any> & { id: string | number }> {
    value: string | number | undefined
    onChange: (value: string | number) => void
    placeholder?: string
    className?: string
    displayField: keyof T // Campo a mostrar en las opciones
    searchField?: keyof T // Campo por el cual buscar (opcional)
    allowClear?: boolean
    disabled?: boolean
    error?: boolean
    enableAllOption?: boolean
    allOptionLabel?: string
    isLoading?: boolean
    updateSearch?: (query: string) => void
    updatePage?: (page: number) => void
    optionsData: T[]
    metaData?: MetaData
}

export function PaginatedCombobox<T extends Record<string, any> & { id: string | number }>({
    value,
    onChange,
    placeholder = 'Seleccionar...',
    className,
    displayField,
    allowClear = false,
    disabled = false,
    error = false,
    enableAllOption = false,
    allOptionLabel = 'TODAS',
    isLoading = false,
    updateSearch,
    updatePage,
    optionsData,
    metaData
}: PaginatedComboboxProps<T>) {
    const internalValue = !value ? (enableAllOption ? 'all' : '') : value
    const [query, setQuery] = useState<string>('')
    const comboboxInputRef = useRef<HTMLInputElement>(null)
    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (updateSearch) {
                updateSearch(query)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query, updateSearch])

    // useEffect(() => {
    //     if (value && !query) {
    //         const existingItem = optionsData.find((item) => item.id === value);

    //         if (existingItem) {
    //             setQuery(existingItem[displayField]);
    //         } else {
    //             //hacer fetch por id
    //         }
    //     }
    // }, [value, optionsData]);

    const options = optionsData || []
    const meta = metaData

    // Agregar opción "TODAS" si está habilitada
    const allOptions = useMemo(() => {
        return enableAllOption
            ? [{ id: 'all', [displayField]: allOptionLabel } as T, ...options]
            : options
    }, [enableAllOption, allOptionLabel, displayField, options])

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(event.target.value)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        // Permitir espacios y evitar que HeadlessUI los bloquee
        if (event.key === ' ') {
            event.stopPropagation()
        }
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange('')
        setQuery('')
    }

    const selectedOption = useMemo(() => {
        if (internalValue === 'all' && enableAllOption) {
            return { id: 'all', [displayField]: allOptionLabel } as T
        }
        return allOptions.find((opt: Option) => opt.id.toString() === internalValue.toString()) ?? null
    }, [internalValue, allOptions, enableAllOption, allOptionLabel, displayField])

    const displayValue = () => {
        if (selectedOption) {
            return selectedOption[displayField] as string
        }
        return enableAllOption ? allOptionLabel : ''
    }

    const handlePageChange = (newPage: number) => {
        if (meta && newPage >= 1 && newPage <= meta.last_page) {
            if (updatePage) {
                updatePage(newPage)
            }
        }
    }

    return (
        <Combobox
            value={internalValue.toString()}
            onChange={(selectedValue: string) => {
                if (selectedValue !== null) {
                    onChange(selectedValue)
                }
                setQuery('')
            }}
            disabled={disabled}
        >
            {({ open }) => {
                return (
                    <div className={cn('relative', className)}>
                        <div className="relative w-full">
                            <ComboboxButton className="w-full" disabled={disabled}>
                                <ComboboxInput
                                    ref={comboboxInputRef}
                                    placeholder={placeholder}
                                    className={cn(
                                        'flex h-8 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                                        error ? 'border-red-500 focus:ring-red-500' : 'border-input',
                                        'pr-10'
                                    )}
                                    displayValue={displayValue}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    autoComplete="off"
                                />
                            </ComboboxButton>

                            {/* Botón para limpiar selección */}
                            {allowClear && internalValue && !disabled && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="absolute inset-y-0 right-8 flex items-center pr-1 hover:text-red-500 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}

                            {/* Ícono chevron */}
                            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2" disabled={disabled}>
                                <ChevronDown
                                    className={cn(
                                        "h-4 w-4 opacity-50 transition-transform duration-200",
                                        open ? "rotate-180" : "",
                                        disabled ? "opacity-25" : ""
                                    )}
                                />
                            </ComboboxButton>
                        </div>

                        <Transition
                            show={open}
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                            afterLeave={() => setQuery('')}
                        >
                            <ComboboxOptions
                                static
                                className="absolute z-50 mt-1 max-h-80 w-full min-w-[250px] overflow-hidden text-sm rounded-md bg-popover border border-border shadow-lg focus:outline-none"
                            >
                                {/* Lista de opciones */}
                                <div className="max-h-60 overflow-auto p-1">
                                    {isLoading ? (
                                        <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground text-center flex gap-2 items-center justify-center">
                                            <Loader2 className='size-4 animate-spin' />
                                            Cargando...
                                        </div>
                                    ) : allOptions.length === 0 ? (
                                        <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground text-center">
                                            {query ? (
                                                <>No se encontraron resultados para "{query}"</>
                                            ) : (
                                                'No hay opciones disponibles'
                                            )}
                                        </div>
                                    ) : (
                                        allOptions.map((option: T) => (
                                            <ComboboxOption
                                                key={option.id}
                                                value={option.id.toString()}
                                                className={({ focus }) =>
                                                    cn(
                                                        'relative cursor-pointer select-none py-1.5 pl-10 pr-4 transition-colors rounded',
                                                        focus ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-gray-50'
                                                    )
                                                }
                                            >
                                                {({ selected }) => (
                                                    <>
                                                        <span className={cn(
                                                            'block truncate',
                                                            selected ? 'font-medium' : 'font-normal'
                                                        )}>
                                                            {option[displayField] as string}
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
                                </div>

                                {/* Paginación */}
                                {/* {meta && meta.last_page > 0 && ( */}
                                {meta && meta.total > 10 && (
                                    <div className="flex items-center justify-between px-2 py-2 border-t border-border bg-accent/30">
                                        <div className="text-xs text-muted-foreground">
                                            {meta.total} resultados
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handlePageChange(meta.current_page - 1)}
                                                disabled={meta.current_page <= 1}
                                                className="h-6 w-6 p-0 disabled:cursor-not-allowed cursor-pointer"
                                            >
                                                <ChevronLeft className="h-3 w-3" />
                                            </Button>
                                            <span className="text-xs text-muted-foreground px-2">
                                                {meta.current_page} / {meta.last_page}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handlePageChange(meta.current_page + 1)}
                                                disabled={meta.current_page >= meta.last_page}
                                                className="h-6 w-6 p-0 disabled:cursor-pointer cursor-pointer"
                                            >
                                                <ChevronRight className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </ComboboxOptions>
                        </Transition>
                    </div>
                )
            }}
        </Combobox>
    )
}