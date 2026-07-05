import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const BOOKS_DIR = resolve(process.cwd(), '..', 'books');

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
  type: 'type',
  fandom: 'fandom',
  genre: 'genre',
  themes: 'themes',
  mode: 'mode',
  pacing: 'pacing',
  pov: 'pov',
  tone: 'tone',
  title: 'title',
  author: 'author',
  synopsis: 'synopsis',
  'cover prompt': 'coverPrompt',
  'cover image': 'coverImage',
  status: 'status',
  'total chapters': 'totalChapters',
};

function parseConfig(markdown: string): BookConfig {
  const config: BookConfig = {
    type: '', fandom: '', genre: '', themes: '', mode: '', pacing: '',
    pov: '', tone: '', title: '', author: '', synopsis: '', coverPrompt: '',
    coverImage: '', status: '', totalChapters: '',
  };

  for (const line of markdown.split('\n')) {
    const match = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/);
    if (!match) continue;
    const key = match[1].toLowerCase().trim();
    const value = match[2].trim();
    if (key === 'setting' || key === 'value' || key.startsWith('-')) continue;
    const configKey = KEY_MAP[key];
    if (configKey) config[configKey] = value;
  }

  return config;
}

export interface Book {
  slug: string;
  config: BookConfig;
  hasCover: boolean;
  coverExt: string;
  chapterCount: number;
}

export interface ChapterMeta {
  number: number;
  title: string;
}

export function getBooks(): Book[] {
  if (!existsSync(BOOKS_DIR)) return [];

  const entries = readdirSync(BOOKS_DIR, { withFileTypes: true });
  const books: Book[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const configPath = join(BOOKS_DIR, entry.name, 'config.md');
    if (!existsSync(configPath)) continue;

    const configMd = readFileSync(configPath, 'utf-8');
    const config = parseConfig(configMd);

    let hasCover = false;
    let coverExt = '';
    for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
      if (existsSync(join(BOOKS_DIR, entry.name, `cover.${ext}`))) {
        hasCover = true;
        coverExt = ext;
        break;
      }
    }

    const chaptersDir = join(BOOKS_DIR, entry.name, 'chapters');
    let chapterCount = 0;
    if (existsSync(chaptersDir)) {
      chapterCount = readdirSync(chaptersDir)
        .filter(f => /^chapter-\d+\.md$/.test(f)).length;
    }

    books.push({ slug: entry.name, config, hasCover, coverExt, chapterCount });
  }

  return books;
}

export function getBook(slug: string): Book | null {
  const safeSlug = slug.replace(/[^a-z0-9-]/g, '');
  if (safeSlug !== slug) return null;

  const configPath = join(BOOKS_DIR, safeSlug, 'config.md');
  if (!existsSync(configPath)) return null;

  const configMd = readFileSync(configPath, 'utf-8');
  const config = parseConfig(configMd);

  let hasCover = false;
  let coverExt = '';
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    if (existsSync(join(BOOKS_DIR, safeSlug, `cover.${ext}`))) {
      hasCover = true;
      coverExt = ext;
      break;
    }
  }

  const chaptersDir = join(BOOKS_DIR, safeSlug, 'chapters');
  let chapterCount = 0;
  if (existsSync(chaptersDir)) {
    chapterCount = readdirSync(chaptersDir)
      .filter(f => /^chapter-\d+\.md$/.test(f)).length;
  }

  return { slug: safeSlug, config, hasCover, coverExt, chapterCount };
}

export function getChapters(slug: string): ChapterMeta[] {
  const safeSlug = slug.replace(/[^a-z0-9-]/g, '');
  const chaptersDir = join(BOOKS_DIR, safeSlug, 'chapters');
  if (!existsSync(chaptersDir)) return [];

  const files = readdirSync(chaptersDir);
  const chapters: ChapterMeta[] = [];

  for (const file of files) {
    const match = file.match(/^chapter-(\d+)\.md$/);
    if (!match) continue;

    const number = parseInt(match[1], 10);
    const content = readFileSync(join(chaptersDir, file), 'utf-8').replace(/^\uFEFF/, '');
    const firstLine = content.split('\n')[0]?.trim() || '';
    const titleMatch = firstLine.match(/#\s*Chapter\s*\d+:\s*(.+)$/);
    const title = titleMatch?.[1]?.trim() || `Chapter ${number}`;

    chapters.push({ number, title });
  }

  return chapters.sort((a, b) => a.number - b.number);
}

export function getChapterContent(slug: string, num: number): string | null {
  const safeSlug = slug.replace(/[^a-z0-9-]/g, '');
  const padded = String(num).padStart(2, '0');
  const filePath = join(BOOKS_DIR, safeSlug, 'chapters', `chapter-${padded}.md`);
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, 'utf-8');
}

// --- Optional prologue / epilogue support -------------------------------------------------
// A story may include an optional `chapters/prologue.md` (rendered before chapter 1) and/or
// `chapters/epilogue.md` (rendered after the last chapter). Both are optional; when present
// they slot into the ordered reading flow: prologue -> chapters -> epilogue.

export type SectionKind = 'prologue' | 'chapter' | 'epilogue';

export interface Section {
  /** URL key for the section route: 'prologue' | '1' | '2' | ... | 'epilogue'. */
  key: string;
  kind: SectionKind;
  /** Chapter number, or null for prologue/epilogue. */
  number: number | null;
  /** Full heading shown as the reader H1 (e.g. 'Chapter 1: X', 'Prologue', 'Epilogue: Y'). */
  heading: string;
  /** Short label for the contents list (chapter title, or the prologue/epilogue heading). */
  label: string;
}

/**
 * Read an optional prologue/epilogue file and return its heading text, or null if absent.
 * @param slug Sanitized story slug.
 * @param kind 'prologue' | 'epilogue'.
 */
function readExtra(slug: string, kind: 'prologue' | 'epilogue'): { heading: string } | null {
  const filePath = join(BOOKS_DIR, slug, 'chapters', `${kind}.md`);
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
  const firstLine = content.split('\n')[0]?.trim() || '';
  const m = firstLine.match(/^#\s*(.+)$/);
  const fallback = kind === 'prologue' ? 'Prologue' : 'Epilogue';
  return { heading: m ? m[1].trim() : fallback };
}

/**
 * Ordered list of all readable sections for a story: optional prologue, then numbered
 * chapters in order, then optional epilogue.
 */
export function getSections(slug: string): Section[] {
  const safeSlug = slug.replace(/[^a-z0-9-]/g, '');
  const sections: Section[] = [];

  const prologue = readExtra(safeSlug, 'prologue');
  if (prologue) {
    const label = prologue.heading.replace(/^prologue\b\s*[:\-–—]?\s*/i, '').trim();
    sections.push({ key: 'prologue', kind: 'prologue', number: null, heading: prologue.heading, label });
  }

  for (const ch of getChapters(safeSlug)) {
    sections.push({ key: String(ch.number), kind: 'chapter', number: ch.number, heading: `Chapter ${ch.number}: ${ch.title}`, label: ch.title });
  }

  const epilogue = readExtra(safeSlug, 'epilogue');
  if (epilogue) {
    const label = epilogue.heading.replace(/^epilogue\b\s*[:\-–—]?\s*/i, '').trim();
    sections.push({ key: 'epilogue', kind: 'epilogue', number: null, heading: epilogue.heading, label });
  }

  return sections;
}

/**
 * Raw markdown for a section by its key ('prologue' | number-as-string | 'epilogue').
 */
export function getSectionContent(slug: string, key: string): string | null {
  const safeSlug = slug.replace(/[^a-z0-9-]/g, '');
  if (key === 'prologue' || key === 'epilogue') {
    const filePath = join(BOOKS_DIR, safeSlug, 'chapters', `${key}.md`);
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath, 'utf-8');
  }
  const n = parseInt(key, 10);
  if (Number.isNaN(n)) return null;
  return getChapterContent(safeSlug, n);
}
