import { cn } from "@/lib/utils"
import { ChevronsLeftRightEllipsis } from "lucide-react"
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react"

type ResizeDirection = "both" | "horizontal" | "vertical"

interface ResizableBoxProps {
    children: React.ReactNode
    className?: string
    direction?: ResizeDirection
    initialSize?: number | string // Acepta "300px" o 50
    minSize?: number | string     // Acepta "100px" o 20
    onResize?: (size: number) => void
}

const ResizableBox: React.FC<ResizableBoxProps> = ({
    children,
    className,
    direction = "vertical",
    initialSize = 100,
    minSize = 20,
    onResize,
}) => {
    const normalizeToPercent = (size: number | string): number => {
        if (typeof size === 'string' && size.endsWith('px')) {
            const pxValue = parseInt(size)
            const base = direction === 'horizontal'
                ? baseSizePx.current.width
                : baseSizePx.current.height
            return base > 0 ? (pxValue / base) * 100 : 100
        }
        return typeof size === 'number' ? size : parseFloat(size)
    }

    const panelRef = useRef<HTMLDivElement | null>(null)
    const handleRef = useRef<HTMLDivElement | null>(null)
    const baseSizePx = useRef<{ width: number; height: number }>({ width: 0, height: 0 })
    const userResized = useRef<boolean>(false)
    const maxSizePx = useRef<{ width: number; height: number }>({ width: 0, height: 0 })
    const autoScrollFrame = useRef<number | null>(null)
    const styleElementRef = useRef<HTMLStyleElement | null>(null)
    const scrollContainer = useRef<HTMLElement | null>(null)
    const isAutoScrolling = useRef<boolean>(false)
    const currentMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

    const [isExpanded, setIsExpanded] = useState<boolean>(initialSize === 100)
    const [size, setSize] = useState<number>(() => {
        if (typeof initialSize === 'string' && initialSize.endsWith('px')) {
            return parseInt(initialSize) // Temporal, se convertirá después
        }
        return typeof initialSize === 'number' ? initialSize : 100
    })
    const [isResizing, setIsResizing] = useState(false)

    const measureNatural = useCallback(() => {
        const el = panelRef.current
        if (!el) return

        const prevHeight = el.style.height
        const prevWidth = el.style.width
        const prevMaxHeight = el.style.maxHeight
        const prevMaxWidth = el.style.maxWidth

        el.style.height = "auto"
        el.style.width = "auto"
        el.style.maxHeight = "none"
        el.style.maxWidth = "none"

        const rect = el.getBoundingClientRect()

        baseSizePx.current = {
            width: Math.ceil(rect.width) || 0,
            height: Math.ceil(rect.height) || 0,
        }

        maxSizePx.current = {
            width: Math.ceil(rect.width) || 0,
            height: Math.ceil(rect.height) || 0,
        }

        el.style.height = prevHeight
        el.style.width = prevWidth
        el.style.maxHeight = prevMaxHeight
        el.style.maxWidth = prevMaxWidth
    }, [])

    useEffect(() => {
        if (typeof initialSize === 'string' && initialSize.endsWith('px') && baseSizePx.current.height > 0) {
            const percentSize = normalizeToPercent(initialSize)
            setSize(percentSize)
        }
    }, [baseSizePx.current.height, baseSizePx.current.width])

    const recalculateResize = useCallback(() => {
        if (!isResizing || !panelRef.current) return

        const panelRect = panelRef.current.getBoundingClientRect()
        const scrollY = window.pageYOffset || document.documentElement.scrollTop
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft

        // Obtener la posición absoluta del panel
        const panelTop = panelRect.top + scrollY
        const panelLeft = panelRect.left + scrollX

        // Calcular la posición del cursor relativa al panel
        const cursorX = currentMousePos.current.x + scrollX
        const cursorY = currentMousePos.current.y + scrollY

        let newSize = 0
        const containerBase = baseSizePx.current

        if (direction === "horizontal") {
            // Distancia desde el borde izquierdo del panel hasta el cursor
            const targetWidth = Math.max(0, cursorX - panelLeft)
            newSize = containerBase.width > 0 ? (targetWidth / containerBase.width) * 100 : 100
        } else if (direction === "vertical") {
            // Distancia desde el borde superior del panel hasta el cursor
            const targetHeight = Math.max(0, cursorY - panelTop)
            newSize = containerBase.height > 0 ? (targetHeight / containerBase.height) * 100 : 100
        } else {
            // Para "both", usar la menor de las dos dimensiones como referencia
            const targetWidth = Math.max(0, cursorX - panelLeft)
            const targetHeight = Math.max(0, cursorY - panelTop)
            const widthPercent = containerBase.width > 0 ? (targetWidth / containerBase.width) * 100 : 100
            const heightPercent = containerBase.height > 0 ? (targetHeight / containerBase.height) * 100 : 100
            newSize = Math.min(widthPercent, heightPercent)
        }

        // Aplicar límites
        const maxAllowed = Math.min(100, direction === "horizontal"
            ? (maxSizePx.current.width / baseSizePx.current.width) * 100
            : direction === "vertical"
                ? (maxSizePx.current.height / baseSizePx.current.height) * 100
                : 100)

        const minSizePercent = normalizeToPercent(minSize)
        newSize = Math.max(minSizePercent, Math.min(maxAllowed, newSize))

        setSize(newSize)
        onResize?.(newSize)
    }, [direction, isResizing, minSize, onResize])

    const handleAutoScroll = useCallback(
        (clientY: number) => {
            const viewportHeight = window.innerHeight
            const scrollThreshold = Math.max(50, viewportHeight * 0.08) // Minimum 50px threshold

            if (autoScrollFrame.current) {
                cancelAnimationFrame(autoScrollFrame.current)
                autoScrollFrame.current = null
            }

            if (!scrollContainer.current) {
                scrollContainer.current =
                    document.getElementById("main-scroll-container") ||
                    (document.querySelector('[data-testid="infinite-scroll-component"]') as HTMLElement) ||
                    (document.querySelector(".infinite-scroll-component") as HTMLElement) ||
                    document.body
            }

            const container = scrollContainer.current
            if (!container) return false

            if (clientY < scrollThreshold) {
                const intensity = Math.max(0.3, (scrollThreshold - clientY) / scrollThreshold)
                const scrollSpeed = Math.ceil(4 * intensity)

                isAutoScrolling.current = true

                const scroll = () => {
                    if (!isResizing || !isAutoScrolling.current) return

                    if (container === document.body) {
                        window.scrollBy(0, -scrollSpeed)
                    } else {
                        container.scrollTop = Math.max(0, container.scrollTop - scrollSpeed)
                    }

                    // Recalcular el redimensionamiento basado en la posición actual del cursor
                    recalculateResize()

                    autoScrollFrame.current = requestAnimationFrame(scroll)
                }

                autoScrollFrame.current = requestAnimationFrame(scroll)
                return true
            }

            if (clientY > viewportHeight - scrollThreshold) {
                const intensity = Math.max(0.3, (clientY - (viewportHeight - scrollThreshold)) / scrollThreshold)
                const scrollSpeed = Math.ceil(4 * intensity)

                isAutoScrolling.current = true

                const scroll = () => {
                    if (!isResizing || !isAutoScrolling.current) return

                    if (container === document.body) {
                        window.scrollBy(0, scrollSpeed)
                    } else {
                        const maxScroll = container.scrollHeight - container.clientHeight
                        container.scrollTop = Math.min(maxScroll, container.scrollTop + scrollSpeed)
                    }

                    // Recalcular el redimensionamiento basado en la posición actual del cursor
                    recalculateResize()

                    autoScrollFrame.current = requestAnimationFrame(scroll)
                }

                autoScrollFrame.current = requestAnimationFrame(scroll)
                return true
            }

            isAutoScrolling.current = false
            return false
        },
        [isResizing, recalculateResize],
    )

    const stopAutoScroll = useCallback(() => {
        isAutoScrolling.current = false
        if (autoScrollFrame.current) {
            cancelAnimationFrame(autoScrollFrame.current)
            autoScrollFrame.current = null
        }
    }, [])

    useLayoutEffect(() => {
        measureNatural()
        const el = panelRef.current
        if (!el) return

        const ro = new ResizeObserver(() => {
            if (!userResized.current) {
                measureNatural()
                if (initialSize === 100) {
                    setSize(initialSize)
                }
            }
        })

        ro.observe(el)
        return () => ro.disconnect()
    }, [initialSize, measureNatural])

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()

            measureNatural()
            userResized.current = true
            setIsResizing(true)

            // Inicializar posición del cursor
            currentMousePos.current = { x: e.clientX, y: e.clientY }
        },
        [measureNatural],
    )

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isResizing) return
            e.preventDefault()
            e.stopPropagation()

            // Actualizar posición actual del cursor
            currentMousePos.current = { x: e.clientX, y: e.clientY }

            const isScrolling = handleAutoScroll(e.clientY)

            // Solo calcular el redimensionamiento si no está en auto-scroll
            // Si está en auto-scroll, recalculateResize() se encarga del cálculo
            if (!isScrolling) {
                recalculateResize()
            }
        },
        [isResizing, handleAutoScroll, recalculateResize],
    )

    const handleMouseUp = useCallback(() => {
        if (!isResizing) return
        setIsResizing(false)
        stopAutoScroll()

        scrollContainer.current = null
    }, [isResizing, stopAutoScroll])

    const handleWheel = useCallback(
        (e: WheelEvent) => {
            if (!isResizing) return

            const container = scrollContainer.current || document.getElementById("main-scroll-container")
            if (container && container !== document.body) {
                container.scrollTop += e.deltaY * 0.5 // Slower manual scroll during resize
            }

            // Recalcular el redimensionamiento después del scroll manual
            setTimeout(() => {
                recalculateResize()
            }, 16) // ~1 frame delay para que el scroll se complete
        },
        [isResizing, recalculateResize],
    )

    useEffect(() => {
        if (!isResizing) return

        const cursor = direction === "horizontal" ? "ew-resize" : direction === "vertical" ? "ns-resize" : "nw-resize"

        const originalBodyCursor = document.body.style.cursor
        const originalBodyUserSelect = document.body.style.userSelect
        const originalBodyPointerEvents = document.body.style.pointerEvents
        const originalHtmlCursor = document.documentElement.style.cursor

        document.body.style.cursor = cursor
        document.body.style.userSelect = "none"
        document.body.style.pointerEvents = "none"
        document.documentElement.style.cursor = cursor

        const styleElement = document.createElement("style")
        styleElement.textContent = `* { cursor: ${cursor} !important; }`
        styleElementRef.current = styleElement
        document.head.appendChild(styleElement)

        document.addEventListener("mousemove", handleMouseMove, { passive: false })
        document.addEventListener("mouseup", handleMouseUp)
        document.addEventListener("wheel", handleWheel, { passive: false })

        return () => {
            document.body.style.cursor = originalBodyCursor
            document.body.style.userSelect = originalBodyUserSelect
            document.body.style.pointerEvents = originalBodyPointerEvents
            document.documentElement.style.cursor = originalHtmlCursor

            if (styleElementRef.current && document.head.contains(styleElementRef.current)) {
                document.head.removeChild(styleElementRef.current)
            }
            styleElementRef.current = null

            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
            document.removeEventListener("wheel", handleWheel)

            stopAutoScroll()
        }
    }, [isResizing, handleMouseMove, handleMouseUp, handleWheel, direction, stopAutoScroll])

    const computedStyle: CSSProperties = {}
    // Aplicar el tamaño inicial incluso si el usuario no ha redimensionado
    const shouldApplySize = userResized.current || initialSize !== 100

    if (shouldApplySize && (baseSizePx.current.width > 0 || baseSizePx.current.height > 0)) {
        if (direction === "vertical") {
            const maxAllowedSize = Math.min(100, (maxSizePx.current.height / baseSizePx.current.height) * 100)
            if (size >= maxAllowedSize - 1) {
                computedStyle.height = "auto"
            } else {
                const px = Math.round((size / 100) * baseSizePx.current.height)
                computedStyle.height = `${px}px`
            }
        } else if (direction === "horizontal") {
            const maxAllowedSize = Math.min(100, (maxSizePx.current.width / baseSizePx.current.width) * 100)
            if (size >= maxAllowedSize - 1) {
                computedStyle.width = "auto"
            } else {
                const px = Math.round((size / 100) * baseSizePx.current.width)
                computedStyle.width = `${px}px`
            }
        } else {
            if (size >= 99) {
                computedStyle.width = "auto"
                computedStyle.height = "auto"
            } else {
                const pxWidth = Math.round((size / 100) * baseSizePx.current.width)
                const pxHeight = Math.round((size / 100) * baseSizePx.current.height)
                computedStyle.width = `${pxWidth}px`
                computedStyle.height = `${pxHeight}px`
            }
        }
    }

    const handleToggleExpanded = () => {
        if (isExpanded) {
            userResized.current = true
            const minSizePercent = normalizeToPercent(minSize)
            setSize(minSizePercent)
            setIsExpanded(false)
        } else {
            userResized.current = false
            setSize(100)
            setIsExpanded(true)

            setTimeout(() => {
                measureNatural()
            }, 0)
        }
    }

    const getHandleProps = () => {
        const baseClasses = "absolute flex items-center justify-center z-20 transition-all duration-200"

        switch (direction) {
            case "horizontal":
                return {
                    className: `${baseClasses} right-0.5 top-0 w-2 h-full cursor-col-resize`,
                    handleStyle: {
                        width: isResizing ? 8 : 6,
                        height: 40,
                        transition: "all 0.2s ease",
                    },
                }
            case "vertical":
                return {
                    className: `${baseClasses} bottom-0.5 h-2 w-full cursor-row-resize`,
                    handleStyle: {
                        width: 40,
                        height: isResizing ? 8 : 6,
                        transition: "all 0.2s ease",
                    },
                }
            default: // both
                return {
                    className: `${baseClasses} bottom-0.5 right-0.5 w-3 h-3 cursor-nw-resize`,
                    handleStyle: {
                        width: 12,
                        height: 12,
                        transition: "all 0.2s ease",
                    },
                }
        }
    }

    const handleProps = getHandleProps()

    const getPanelProps = () => {
        switch (direction) {
            case "horizontal":
                return {
                    className: `pr-2`
                }
            case "vertical":
                return {
                    className: `pb-2`
                }
            default:
                return {
                    className: ``
                }
        }
    }
    const panelProps = getPanelProps()

    return (
        <div className="relative">
            <div ref={panelRef} className={cn("relative overflow-hidden", panelProps.className, className)} style={computedStyle}>
                {children}

                {/* Handle original */}
                <div
                    ref={handleRef}
                    role="separator"
                    aria-orientation={direction === "vertical" ? "horizontal" : "vertical"}
                    tabIndex={0}
                    onDoubleClick={handleToggleExpanded}
                    onMouseDown={handleMouseDown}
                    className={handleProps.className}
                    title={"Arrastra para redimensionar"} //, doble clic para expandir/contraer
                >
                    <div
                        className={cn(
                            `${direction === "both" ? "rounded-xs group opacity-80" : "rounded-full transition-all duration-200"}`,
                            isResizing ? "bg-gray-700 shadow-lg scale-105 opacity-100" : "bg-gray-400 hover:bg-gray-500 hover:shadow-md",
                        )}
                        style={handleProps.handleStyle}
                    >
                        {
                            direction === "both" &&
                            <ChevronsLeftRightEllipsis className={`size-3 rotate-45 group-hover:text-gray-200 ${isResizing ? "text-gray-200" : "text-gray-700"}`} />
                        }
                    </div>
                    {isResizing && isAutoScrolling.current && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            Tambien puedes usar la rueda para scroll
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ResizableBox