import { useEffect, useState } from "react";
import type { PluginAPI } from "@tps/plugin-sdk";

/**
 * Pantalla de diagnóstico del plugin de facturación.
 *
 * No simula nada: PRUEBA cada capacidad de verdad contra el host y reporta el
 * resultado. La idea es responder con evidencia —no con suposiciones— qué puede
 * hacer un plugin de facturación en cada target antes de escribirlo en serio.
 */

type Estado = "ok" | "falla" | "ausente" | "probando";

interface Prueba {
  nombre: string;
  detalle: string;
  estado: Estado;
  resultado?: string;
}

const COLOR: Record<Estado, string> = {
  ok: "#16a34a",
  falla: "#dc2626",
  ausente: "#a16207",
  probando: "#6b7280",
};

const ICONO: Record<Estado, string> = {
  ok: "✓",
  falla: "✕",
  ausente: "—",
  probando: "…",
};

export function createDiagnosticoScreen(api: PluginAPI) {
  const DiagnosticoScreen = () => {
    const [pruebas, setPruebas] = useState<Prueba[]>([]);
    const [entorno, setEntorno] = useState<Record<string, string>>({});

    useEffect(() => {
      const correr = async () => {
        const resultados: Prueba[] = [];

        const probar = async (
          nombre: string,
          detalle: string,
          fn: () => Promise<string> | string,
        ) => {
          try {
            resultados.push({
              nombre,
              detalle,
              estado: "ok",
              resultado: await fn(),
            });
          } catch (e) {
            resultados.push({
              nombre,
              detalle,
              estado: "falla",
              resultado: e instanceof Error ? e.message : String(e),
            });
          }
        };

        // ── Lo que un plugin de facturación necesita de verdad ───────────────

        await probar(
          "storage",
          "Guardar el borrador de una factura y recuperarlo",
          async () => {
            const clave = "sonda-factura";
            const borrador = { nro: 1, total: 1234.56, ts: Date.now() };
            await api.storage.set(clave, borrador);
            const leido = await api.storage.get<typeof borrador>(clave);
            await api.storage.delete(clave);

            if (leido?.total !== borrador.total) {
              throw new Error("El valor leído no coincide con el guardado");
            }
            return `round-trip OK (total ${leido.total})`;
          },
        );

        await probar(
          "notify",
          "Avisarle al usuario que la factura se emitió",
          () => {
            api.notify("Sonda de facturación: prueba de notificación", {
              variant: "info",
            });
            return "notificación emitida";
          },
        );

        await probar("events", "Publicar un evento para otros plugins", () => {
          api.emitEvent("facturacion:sonda", { ok: true });
          return "evento publicado";
        });

        // ── El límite: red hacia afuera ──────────────────────────────────────

        await probar(
          "fetch al backend propio",
          "Mismo origen: acá viven la firma y el envío al SIN",
          async () => {
            const r = await fetch("/api/v1/plugins", {
              headers: { Accept: "application/json" },
            });
            // 401 también es una respuesta válida: significa que LLEGÓ.
            return `HTTP ${r.status} — el request salió y volvió`;
          },
        );

        await probar(
          "fetch a un tercero",
          "Llamar directo a un servicio externo desde el plugin",
          async () => {
            // En escritorio esto lo permitiría Rust; en el navegador lo frena
            // CORS salvo que el otro lado autorice el origen.
            const r = await fetch("https://example.com", { mode: "cors" });
            return `HTTP ${r.status} — el tercero autorizó el origen`;
          },
        );

        // ── Impresión ────────────────────────────────────────────────────────

        resultados.push({
          nombre: "printing",
          detalle: "Imprimir la factura por el flujo del sistema",
          estado: typeof window.print === "function" ? "ok" : "ausente",
          resultado:
            typeof window.print === "function"
              ? "window.print() disponible"
              : "sin API de impresión",
        });

        const tieneSerial = "serial" in navigator;
        const tieneUSB = "usb" in navigator;

        resultados.push({
          nombre: "printing.raw",
          detalle: "Impresora fiscal / térmica por puerto, cajón de dinero",
          estado: tieneSerial || tieneUSB ? "ok" : "ausente",
          resultado: tieneSerial || tieneUSB
            ? `WebSerial=${tieneSerial} WebUSB=${tieneUSB} — requiere permiso del usuario POR DISPOSITIVO`
            : "sin acceso a puertos: hace falta el host de escritorio",
        });

        // ── Qué dice el host que tenemos ─────────────────────────────────────

        for (const cap of [
          "views",
          "navigation",
          "storage",
          "notifications",
          "commands",
          "events",
          "keybindings",
          "printing",
          "printing.raw",
          "http.external",
          "filesystem",
        ]) {
          const declarada = api.hasCapability(cap as never);
          resultados.push({
            nombre: `hasCapability("${cap}")`,
            detalle: "Lo que el host declara para este target",
            estado: declarada ? "ok" : "ausente",
            resultado: String(declarada),
          });
        }

        setPruebas(resultados);
      };

      setEntorno({
        "¿Tauri?": String(
          "__TAURI_INTERNALS__" in window || "__TAURI__" in window,
        ),
        origen: window.location.origin,
        "contexto seguro": String(window.isSecureContext),
        navegador: navigator.userAgent.slice(0, 60) + "…",
      });

      correr();
    }, []);

    return (
      <div style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          Sonda de facturación
        </h1>
        <p style={{ color: "#6b7280", marginBottom: 20, fontSize: 14 }}>
          Prueba cada capacidad contra el host real y reporta qué está
          disponible en este target.
        </p>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
            Entorno
          </h2>
          <table style={{ fontSize: 13, borderCollapse: "collapse" }}>
            <tbody>
              {Object.entries(entorno).map(([k, v]) => (
                <tr key={k}>
                  <td style={{ padding: "3px 16px 3px 0", color: "#6b7280" }}>
                    {k}
                  </td>
                  <td style={{ padding: "3px 0", fontFamily: "monospace" }}>
                    {v}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
            Capacidades ({pruebas.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {pruebas.map((p, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "8px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    color: COLOR[p.estado],
                    fontWeight: 700,
                    minWidth: 14,
                  }}
                >
                  {ICONO[p.estado]}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontFamily: "monospace" }}>
                    {p.nombre}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>
                    {p.detalle}
                  </div>
                  {p.resultado && (
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 12,
                        color: COLOR[p.estado],
                        wordBreak: "break-word",
                      }}
                    >
                      {p.resultado}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  };

  DiagnosticoScreen.displayName = "FacturacionDiagnostico";
  return DiagnosticoScreen;
}
