import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Archivo is our display substitute for Booster Polygonal, Brand Identity Section 4.
loadFont({
  family: "Archivo",
  url: staticFile("fonts/archivo/archivo-variable-latin.woff2"),
  weight: "100 900",
}).catch(console.error);
