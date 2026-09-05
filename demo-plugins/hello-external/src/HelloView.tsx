/**
 * HelloView — Vista del plugin externo Hello External.
 *
 * Componente React standalone que valida:
 * 1. El React singleton compartido (useState incrementa sin "Invalid hook call")
 * 2. La renderización de componentes de un plugin externo instalado a disco
 *
 * NO importa nada del host (@/ paths, @tauri-apps/*, stores).
 * Solo React — provisto como singleton compartido por el host via Module Federation.
 */
import { useState } from "react";

export function HelloView() {
  const [count, setCount] = useState(0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minHeight: "400px",
        padding: "2rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
        gap: "1.5rem",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🔌</div>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: "700",
            margin: 0,
            color: "#1e293b",
          }}
        >
          Plugin externo instalado
        </h1>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "500",
            margin: "0.25rem 0 0",
            color: "#64748b",
          }}
        >
          Hello External
        </h2>
      </div>

      {/* Badge de validación */}
      <div
        style={{
          background: "#dcfce7",
          border: "1px solid #86efac",
          borderRadius: "0.5rem",
          padding: "0.75rem 1.5rem",
          color: "#166534",
          fontSize: "0.875rem",
          fontWeight: "500",
          textAlign: "center",
        }}
      >
        Plugin ID: <code style={{ fontFamily: "monospace" }}>com.tps.demo-external</code>
        <br />
        Ruta: <code style={{ fontFamily: "monospace" }}>/demo/external</code>
      </div>

      {/* Contador — valida React singleton */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "1rem",
          padding: "2rem",
          textAlign: "center",
          minWidth: "250px",
        }}
      >
        <p
          style={{
            margin: "0 0 0.5rem",
            color: "#475569",
            fontSize: "0.875rem",
          }}
        >
          Contador (valida React singleton)
        </p>
        <div
          style={{
            fontSize: "3.5rem",
            fontWeight: "700",
            color: "#3b82f6",
            lineHeight: 1,
            margin: "0.5rem 0 1rem",
          }}
        >
          {count}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <button
            onClick={() => setCount((c) => c - 1)}
            style={{
              padding: "0.5rem 1.25rem",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              fontSize: "1.125rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            −
          </button>
          <button
            onClick={() => setCount(0)}
            style={{
              padding: "0.5rem 1.25rem",
              background: "#94a3b8",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Reset
          </button>
          <button
            onClick={() => setCount((c) => c + 1)}
            style={{
              padding: "0.5rem 1.25rem",
              background: "#22c55e",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              fontSize: "1.125rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            +
          </button>
        </div>
        {count !== 0 && (
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.75rem",
              color: "#22c55e",
            }}
          >
            React singleton OK — hooks funcionan correctamente
          </p>
        )}
      </div>

      {/* Info técnica */}
      <div
        style={{
          color: "#94a3b8",
          fontSize: "0.75rem",
          textAlign: "center",
          maxWidth: "400px",
        }}
      >
        Plugin externo cargado via Module Federation + asset:// protocol.
        <br />
        Federation name: <code>helloExternal</code> | Keybinding: <kbd>Ctrl+Shift+E</kbd>
      </div>
    </div>
  );
}
