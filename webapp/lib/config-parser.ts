/**
 * Parses the markdown table format used in config.md files.
 * Format: | Setting | Value |
 */

export interface BookConfig {
  type: string;
  fandom: string;
  genre: string;
  themes: string;
  mode: string;
  pacing: string;
  pov: string;
  tone: string;
  title: string;
  author: string;
  synopsis: string;
  coverPrompt: string;
  coverImage: string;
  status: string;
  totalChapters: string;
}

const KEY_MAP: Record<string, keyof BookConfig> = {
  type: "type",
  fandom: "fandom",
  genre: "genre",
  themes: "themes",
  mode: "mode",
  pacing: "pacing",
  pov: "pov",
  tone: "tone",
  title: "title",
  author: "author",
  synopsis: "synopsis",
  "cover prompt": "coverPrompt",
  "cover image": "coverImage",
  status: "status",
  "total chapters": "totalChapters",
};

export function parseConfig(markdown: string): BookConfig {
  const config: BookConfig = {
    type: "",
    fandom: "",
    genre: "",
    themes: "",
    mode: "",
    pacing: "",
    pov: "",
    tone: "",
    title: "",
    author: "",
    synopsis: "",
    coverPrompt: "",
    coverImage: "",
    status: "",
    totalChapters: "",
  };

  const lines = markdown.split("\n");
  for (const line of lines) {
    const match = line.match(/^\|\s*(.+?)\s*\|\s*(.*?)\s*\|$/);
    if (!match) continue;

    const rawKey = match[1].toLowerCase().trim();
    const value = match[2].trim();

    // Skip header and separator rows
    if (rawKey === "setting" || rawKey.startsWith("---")) continue;

    const configKey = KEY_MAP[rawKey];
    if (configKey) {
      config[configKey] = value;
    }
  }

  return config;
}
