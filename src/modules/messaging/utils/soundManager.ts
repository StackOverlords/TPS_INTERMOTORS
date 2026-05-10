/**
 * Singleton para reproducir sonidos del sistema de mensajería.
 *
 * Características:
 *  - Precarga los audios al importar (evita latencia en el primer play)
 *  - Respeta el silenciado global del sistema operativo / pestaña
 *  - Reinicia el audio antes de reproducir (permite sonidos rápidos consecutivos)
 *  - No lanza errores visibles al usuario si el browser bloquea el autoplay
 *  - Control de volumen y mute independiente por tipo
 */
import sentMp3 from "@/assets/sounds/message-sent.mp3";
import receivedMp3 from "@/assets/sounds/message-received.mp3";
// ─────────────────────────────────────────────────────────────────────────────
// AUDIO INSTANCES — precargadas una sola vez
// ─────────────────────────────────────────────────────────────────────────────

function createAudio(src: string, volume: number) {
  const audio = new Audio(src);
  audio.volume = volume;
  audio.preload = "auto";
  // Silenciar errores de precarga (common en SSR o primer render)
  audio.addEventListener("error", () => {}, { once: false });
  return audio;
}

const sounds = {
  sent: createAudio(sentMp3, 0.4),
  received: createAudio(receivedMp3, 0.5),
} as const;

export type SoundType = keyof typeof sounds;

// ─────────────────────────────────────────────────────────────────────────────
// MUTE STATE — persiste en localStorage
// ─────────────────────────────────────────────────────────────────────────────

const MUTE_KEY = "chat_sounds_muted";

let _muted: boolean = (() => {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

export const soundManager = {
  /**
   * Reproduce un sonido del chat.
   * No hace nada si el sistema está muteado o el documento no está visible
   * (el usuario está en otra pestaña → no bombardear con sonidos al volver).
   */
  play(type: SoundType): void {
    if (_muted) return;
    // No reproducir si el usuario no está mirando la app (otra pestaña/ventana)
    if (document.visibilityState === "hidden") return;

    const audio = sounds[type];
    console.debug(`[SoundManager] Playing sound: ${type}`, audio);
    // Reiniciar posición para permitir sonidos rápidos consecutivos
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Autoplay bloqueado por el browser — ignorar silenciosamente.
      // Ocurre antes de la primera interacción del usuario con la página.
    });
  },

  get isMuted(): boolean {
    return _muted;
  },

  mute(): void {
    _muted = true;
    try {
      localStorage.setItem(MUTE_KEY, "1");
    } catch {}
  },

  unmute(): void {
    _muted = false;
    try {
      localStorage.removeItem(MUTE_KEY);
    } catch {}
  },

  toggle(): boolean {
    if (_muted) {
      this.unmute();
    } else {
      this.mute();
    }
    return _muted;
  },

  /**
   * Ajustar volumen en runtime (0.0 – 1.0)
   */
  setVolume(type: SoundType, volume: number): void {
    sounds[type].volume = Math.max(0, Math.min(1, volume));
  },
};
