import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import matter from 'gray-matter';

const BOOKS_DIR = resolve(process.cwd(), '..', 'books');

export interface BookConfig {
  fandom: string;
  genre: string[];
  themes: string[];
  pov: string;
  title: string;
  author: string;
  synopsis: string;
  status: string;
}

function stringValue(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(stringValue).filter(Boolean);
  return stringValue(value).split(',').map(item => item.trim()).filter(Boolean);
}

function markdownSection(markdown: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = markdown.match(new RegExp(`^##\\s+${escaped}\\s*$([\\s\\S]*?)(?=^##\\s+|$(?![\\s\\S]))`, 'im'));
  return match?.[1]?.trim() ?? '';
}

export function parseStoryMarkdown(markdown: string): BookConfig {
  const parsed = matter(markdown.replace(/^\uFEFF/, ''));
  return {
    title: stringValue(parsed.data.title),
    author: stringValue(parsed.data.author),
    synopsis: markdownSection(parsed.content, 'Synopsis'),
    fandom: stringValue(parsed.data.fandom),
    genre: stringList(parsed.data.genre),
    themes: stringList(parsed.data.themes),
    pov: stringValue(parsed.data.pov),
    status: stringValue(parsed.data.status),
  };
}

export function parseChapterMarkdown(markdown: string): { title: string; prose: string } {
  const parsed = matter(markdown.replace(/^\uFEFF/, ''));
  const heading = parsed.content.match(/^#\s*(.+)$/m)?.[1]?.trim() ?? '';
  const title = stringValue(parsed.data.title)
    || heading.replace(/^Chapter\s+\d+\s*:\s*/i, '').trim();
  const chapterText = parsed.content.match(/^##\s+Chapter Text\s*$/im);
  let prose = chapterText
    ? parsed.content.slice((chapterText.index ?? 0) + chapterText[0].length)
    : parsed.content.replace(/^#\s*[^\n]*\r?\n+/, '');

  return { title, prose: prose.trim() };
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

    const storyPath = join(BOOKS_DIR, entry.name, 'story.md');
    if (!existsSync(storyPath)) continue;

    let config: BookConfig;
    try {
      config = parseStoryMarkdown(readFileSync(storyPath, 'utf-8'));
    } catch (error) {
      console.warn(`Skipping book "${entry.name}": ${error instanceof Error ? error.message : error}`);
      continue;
    }

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

  const storyPath = join(BOOKS_DIR, safeSlug, 'story.md');
  if (!existsSync(storyPath)) return null;

  let config: BookConfig;
  try {
    config = parseStoryMarkdown(readFileSync(storyPath, 'utf-8'));
  } catch (error) {
    console.warn(`Skipping book "${safeSlug}": ${error instanceof Error ? error.message : error}`);
    return null;
  }

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
    const content = readFileSync(join(chaptersDir, file), 'utf-8');
    const title = parseChapterMarkdown(content).title || `Chapter ${number}`;

    chapters.push({ number, title });
  }

  return chapters.sort((a, b) => a.number - b.number);
}

export function getChapterContent(slug: string, num: number): string | null {
  const safeSlug = slug.replace(/[^a-z0-9-]/g, '');
  const padded = String(num).padStart(2, '0');
  const filePath = join(BOOKS_DIR, safeSlug, 'chapters', `chapter-${padded}.md`);
  if (!existsSync(filePath)) return null;
  return parseChapterMarkdown(readFileSync(filePath, 'utf-8')).prose;
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
  const fallback = kind === 'prologue' ? 'Prologue' : 'Epilogue';
  const title = parseChapterMarkdown(readFileSync(filePath, 'utf-8')).title;
  return { heading: title || fallback };
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
    return parseChapterMarkdown(readFileSync(filePath, 'utf-8')).prose;
  }
  const n = parseInt(key, 10);
  if (Number.isNaN(n)) return null;
  return getChapterContent(safeSlug, n);
}
