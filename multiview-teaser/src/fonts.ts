import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// KickFont renders the wordmark lockup only, Brand Identity Section 4. Archivo
// is the display substitute for reading text.
export function ensureFonts() {
  return Promise.all([
    loadFont({ family: "KickFont", url: staticFile("fonts/kick-font/kick-font.ttf") }),
    loadFont({
      family: "Archivo",
      url: staticFile("fonts/archivo/archivo-variable-latin.woff2"),
      weight: "100 900",
    }),
  ]);
}
