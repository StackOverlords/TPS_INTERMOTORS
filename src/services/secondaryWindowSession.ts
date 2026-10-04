/**
 * Relevo de sesión entre la ventana principal y las secundarias.
 *
 * Una ventana secundaria lee la sesión del IndexedDB compartido. Si el access
 * token guardado ya venció (PC suspendida, app en segundo plano), arranca sin
 * sesión: antes eso la dejaba haciendo requests sin token, o directamente
 * borraba la sesión de toda la app (ver `sdk-simple-auth.ts`).
 *
 * La ventana principal es la única que renueva tokens. Así que la secundaria
 * le pide la sesión y la principal responde con una vigente, renovándola
 * primero si hace falta. El canal es el del WindowManager (eventos de Tauri en
 * escritorio, BroadcastChannel en web): no sale de la app.
 */

import { getWindowManager } from "@/platform";
import authSDK, { onSecondaryWindowTokenExpired } from "./sdk-simple-auth";

const REQUEST_TOPIC = "auth:session-request";
const RESPONSE_EVENT = "auth:session";

interface SessionRequest {
  windowId: string;
}

interface SessionResponse {
  user: unknown;
  tokens: unknown;
}

type AuthState = { user?: unknown; tokens?: unknown };

/** Ventana principal: responde los pedidos de sesión de las secundarias. */
export function serveSessionToSecondaryWindows(): void {
  const windows = getWindowManager();
  void windows.subscribe(REQUEST_TOPIC, (payload) => {
    const windowId = (payload as Partial<SessionRequest> | undefined)?.windowId;
    if (!windowId) return;

    void (async () => {
      // Renueva si hace falta: es la única ventana que lo hace.
      const accessToken = await authSDK.getValidAccessToken().catch(() => null);
      const { user, tokens } = authSDK.getState() as AuthState;
      if (!accessToken || !user || !tokens) return;

      await windows
        .emitToWindow<SessionResponse>(windowId, RESPONSE_EVENT, { user, tokens })
        .catch(() => {});
    })();
  });
}

/**
 * Ventana secundaria: si arrancó sin sesión, la pide a la principal. Resuelve
 * `true` si quedó con sesión (ya la tenía o la recibió), `false` si no hubo
 * respuesta a tiempo; en ese caso la ventana sigue y muestra lo que pueda.
 */
export async function ensureSecondaryWindowSession(timeoutMs = 4000): Promise<boolean> {
  await authSDK.ready;
  if ((authSDK.getState() as AuthState).user) return true;
  return requestSessionFromMain(timeoutMs);
}

/** Pide a la principal una sesión vigente y la aplica. */
function requestSessionFromMain(timeoutMs = 4000): Promise<boolean> {
  const windows = getWindowManager();
  const windowId = windows.getCurrentWindowId();
  if (!windowId) return Promise.resolve(false);

  // `applyRemoteSession` es lo que el SDK usa al recibir la sesión de otra
  // pestaña (tabSync). No está en sus tipos públicos.
  const sdk = authSDK as unknown as {
    applyRemoteSession?: (user: unknown, tokens: unknown) => void;
  };
  if (typeof sdk.applyRemoteSession !== "function") return Promise.resolve(false);

  return new Promise<boolean>((resolve) => {
    let settled = false;
    let unlisten: (() => void) | undefined;

    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unlisten?.();
      resolve(ok);
    };

    const timer = setTimeout(() => finish(false), timeoutMs);

    void windows
      .listenToWindowEvent<SessionResponse>(windowId, RESPONSE_EVENT, ({ user, tokens }) => {
        if (!user || !tokens) return;
        sdk.applyRemoteSession!(user, tokens);
        finish(true);
      })
      .then((stop) => {
        unlisten = stop;
        if (settled) stop();
        // Recién con el listener puesto se pide, para no perder la respuesta.
        return windows.broadcast(REQUEST_TOPIC, { windowId } satisfies SessionRequest);
      })
      .catch(() => finish(false));
  });
}

// Si el token vence con la ventana abierta, en vez de cerrar la sesión de toda
// la app (lo que hacía el SDK), se pide una nueva a la principal.
if (getWindowManager().isSecondaryWindow()) {
  onSecondaryWindowTokenExpired(() => {
    void requestSessionFromMain();
  });
}
