const files = import.meta.glob("../textures/*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export type TextureKey = "earth-dark" | "moon" | "mars" | "sun";

export const textureUrl = (key: TextureKey) => {
  const url = files[`../textures/${key}.jpg`];
  if (!url) throw new Error(`No texture for ${key}. Add demo/src/kick/textures/${key}.jpg`);
  return url;
};
