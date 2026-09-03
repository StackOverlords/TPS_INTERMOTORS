/**
 * Adaptador Tauri del puerto `ImageProcessorPort`.
 *
 * Delega en los comandos Rust de `src-tauri/src/commands/image.rs`, que usan
 * `libwebp-sys` para codificar.
 */

import { invoke } from '@tauri-apps/api/core';

import type {
  CompressToWebPOptions,
  ImageInfo,
  ImageProcessorPort,
} from '@/platform/ports/imageProcessor';

export const tauriImageProcessor: ImageProcessorPort = {
  async getImageInfo(base64Data: string): Promise<ImageInfo> {
    return invoke<ImageInfo>('get_image_info', { base64Data });
  },

  async compressToWebP(
    base64Data: string,
    { quality, effort = 4 }: CompressToWebPOptions,
  ): Promise<string> {
    return invoke<string>('compress_image_to_webp', {
      base64Data,
      quality,
      effort,
    });
  },
};
