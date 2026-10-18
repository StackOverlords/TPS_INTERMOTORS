// Registra las fuentes "bundled" de fontCatalog.ts, solo el subset latin
// (cubre el español completo). Los paquetes de fontsource registran todos los
// alfabetos juntos y no traen un CSS por subset, por eso se arma a mano.
// Los archivos van empaquetados con la app: la CSP de escritorio solo admite
// fuentes de 'self' (un CDN quedaria bloqueado) y asi se ven igual sin internet.
// Ningun .woff2 pesa menos de 4 KB, asi que Vite no los incrusta como data:,
// que la CSP tambien bloquearia. El navegador solo los descarga cuando la
// fuente se usa, asi que registrarlas todas no cuesta.

import interUrl from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';
import robotoUrl from '@fontsource-variable/roboto/files/roboto-latin-wght-normal.woff2?url';
import openSansUrl from '@fontsource-variable/open-sans/files/open-sans-latin-wght-normal.woff2?url';
import sourceSans3Url from '@fontsource-variable/source-sans-3/files/source-sans-3-latin-wght-normal.woff2?url';
import nunitoSansUrl from '@fontsource-variable/nunito-sans/files/nunito-sans-latin-wght-normal.woff2?url';
import notoSansUrl from '@fontsource-variable/noto-sans/files/noto-sans-latin-wght-normal.woff2?url';
import ibmPlexSansUrl from '@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2?url';
import workSansUrl from '@fontsource-variable/work-sans/files/work-sans-latin-wght-normal.woff2?url';
import dmSansUrl from '@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2?url';
import manropeUrl from '@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2?url';
import montserratUrl from '@fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2?url';
import loraUrl from '@fontsource-variable/lora/files/lora-latin-wght-normal.woff2?url';
import merriweatherUrl from '@fontsource-variable/merriweather/files/merriweather-latin-wght-normal.woff2?url';
import sourceSerif4Url from '@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2?url';
import jetbrainsMonoUrl from '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?url';
import robotoMonoUrl from '@fontsource-variable/roboto-mono/files/roboto-mono-latin-wght-normal.woff2?url';

// Fuentes sin version variable: solo los pesos que usa la UI (normal, medium, semibold, bold)
import lato400Url from '@fontsource/lato/files/lato-latin-400-normal.woff2?url';
import lato700Url from '@fontsource/lato/files/lato-latin-700-normal.woff2?url';
import poppins400Url from '@fontsource/poppins/files/poppins-latin-400-normal.woff2?url';
import poppins500Url from '@fontsource/poppins/files/poppins-latin-500-normal.woff2?url';
import poppins600Url from '@fontsource/poppins/files/poppins-latin-600-normal.woff2?url';
import poppins700Url from '@fontsource/poppins/files/poppins-latin-700-normal.woff2?url';
import firaSans400Url from '@fontsource/fira-sans/files/fira-sans-latin-400-normal.woff2?url';
import firaSans500Url from '@fontsource/fira-sans/files/fira-sans-latin-500-normal.woff2?url';
import firaSans600Url from '@fontsource/fira-sans/files/fira-sans-latin-600-normal.woff2?url';
import firaSans700Url from '@fontsource/fira-sans/files/fira-sans-latin-700-normal.woff2?url';

// Mismo unicode-range que usa fontsource para el subset latin
const LATIN_RANGE =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

// [familia (igual que en fontCatalog.ts), url, peso o rango de pesos]
const FONT_FACES: ReadonlyArray<[family: string, url: string, weight: string]> = [
  ['Inter Variable', interUrl, '100 900'],
  ['Roboto Variable', robotoUrl, '100 900'],
  ['Open Sans Variable', openSansUrl, '300 800'],
  ['Source Sans 3 Variable', sourceSans3Url, '200 900'],
  ['Nunito Sans Variable', nunitoSansUrl, '200 1000'],
  ['Noto Sans Variable', notoSansUrl, '100 900'],
  ['IBM Plex Sans Variable', ibmPlexSansUrl, '100 700'],
  ['Work Sans Variable', workSansUrl, '100 900'],
  ['DM Sans Variable', dmSansUrl, '100 1000'],
  ['Manrope Variable', manropeUrl, '200 800'],
  ['Montserrat Variable', montserratUrl, '100 900'],
  ['Lora Variable', loraUrl, '400 700'],
  ['Merriweather Variable', merriweatherUrl, '300 900'],
  ['Source Serif 4 Variable', sourceSerif4Url, '200 900'],
  ['JetBrains Mono Variable', jetbrainsMonoUrl, '100 800'],
  ['Roboto Mono Variable', robotoMonoUrl, '100 700'],
  ['Lato', lato400Url, '400'],
  ['Lato', lato700Url, '700'],
  ['Poppins', poppins400Url, '400'],
  ['Poppins', poppins500Url, '500'],
  ['Poppins', poppins600Url, '600'],
  ['Poppins', poppins700Url, '700'],
  ['Fira Sans', firaSans400Url, '400'],
  ['Fira Sans', firaSans500Url, '500'],
  ['Fira Sans', firaSans600Url, '600'],
  ['Fira Sans', firaSans700Url, '700'],
];

for (const [family, url, weight] of FONT_FACES) {
  // Sin .load(): el FontFace queda "unloaded" hasta que algun texto lo usa
  document.fonts.add(
    new FontFace(family, `url(${url}) format('woff2')`, {
      weight,
      style: 'normal',
      display: 'swap',
      unicodeRange: LATIN_RANGE,
    }),
  );
}
