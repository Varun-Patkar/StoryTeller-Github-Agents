import { readdir, readFile, stat } from "fs/promises";
import { join, resolve } from "path";
import { parseConfig, type BookConfig } from "./config-parser";

const BOOKS_DIR = resolve(/*turbopackIgnore: true*/ process.cwd(), "..", "books");

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
  fileName: string;
}

export interface ChapterContent {
  meta: ChapterMeta;
  content: string;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function getBooks(): Promise<Book[]> {
  const entries = await readdir(BOOKS_DIR, { withFileTypes: true });
  const books: Book[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const configPath = join(BOOKS_DIR, entry.name, "config.md");
    if (!(await fileExists(configPath))) continue;

    const configMd = await readFile(configPath, "utf-8");
    const config = parseConfig(configMd);

    // Check for cover image
    let hasCover = false;
    let coverExt = "";
    for (const ext of ["jpg", "jpeg", "png", "webp"]) {
      if (await fileExists(join(BOOKS_DIR, entry.name, `cover.${ext}`))) {
        hasCover = true;
        coverExt = ext;
        break;
      }
    }

    // Count chapters
    const chaptersDir = join(BOOKS_DIR, entry.name, "chapters");
    let chapterCount = 0;
    if (await fileExists(chaptersDir)) {
      const chapters = await readdir(chaptersDir);
      chapterCount = chapters.filter((f) =>
        /^chapter-\d+\.md$/.test(f)
      ).length;
    }

    books.push({
      slug: entry.name,
      config,
      hasCover,
      coverExt,
      chapterCount,
    });
  }

  return books;
}

export async function getBook(slug: string): Promise<Book | null> {
  // Sanitize slug to prevent path traversal
  const safeSlug = slug.replace(/[^a-z0-9-]/g, "");
  if (safeSlug !== slug) return null;

  const configPath = join(BOOKS_DIR, safeSlug, "config.md");
  if (!(await fileExists(configPath))) return null;

  const configMd = await readFile(configPath, "utf-8");
  const config = parseConfig(configMd);

  let hasCover = false;
  let coverExt = "";
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    if (await fileExists(join(BOOKS_DIR, safeSlug, `cover.${ext}`))) {
      hasCover = true;
      coverExt = ext;
      break;
    }
  }

  const chaptersDir = join(BOOKS_DIR, safeSlug, "chapters");
  let chapterCount = 0;
  if (await fileExists(chaptersDir)) {
    const chapters = await readdir(chaptersDir);
    chapterCount = chapters.filter((f) =>
      /^chapter-\d+\.md$/.test(f)
    ).length;
  }

  return { slug: safeSlug, config, hasCover, coverExt, chapterCount };
}

export async function getChapters(slug: string): Promise<ChapterMeta[]> {
  const safeSlug = slug.replace(/[^a-z0-9-]/g, "");
  const chaptersDir = join(BOOKS_DIR, safeSlug, "chapters");

  if (!(await fileExists(chaptersDir))) return [];

  const files = await readdir(chaptersDir);
  const chapters: ChapterMeta[] = [];

  for (const file of files) {
    const match = file.match(/^chapter-(\d+)\.md$/);
    if (!match) continue;

    const number = parseInt(match[1], 10);
    const content = await readFile(join(chaptersDir, file), "utf-8");
    const firstLine = content.split("\n")[0] || "";
    const titleMatch = firstLine.match(/^#\s*Chapter\s*\d+:\s*(.*)$/);
    const title = titleMatch?.[1]?.trim() || `Chapter ${number}`;

    chapters.push({ number, title, fileName: file });
  }

  return chapters.sort((a, b) => a.number - b.number);
}

export async function getChapter(
  slug: string,
  chapterNum: number
): Promise<ChapterContent | null> {
  const safeSlug = slug.replace(/[^a-z0-9-]/g, "");
  const padded = String(chapterNum).padStart(2, "0");
  const filePath = join(BOOKS_DIR, safeSlug, "chapters", `chapter-${padded}.md`);

  if (!(await fileExists(filePath))) return null;

  const content = await readFile(filePath, "utf-8");
  const firstLine = content.split("\n")[0] || "";
  const titleMatch = firstLine.match(/^#\s*Chapter\s*\d+:\s*(.*)$/);
  const title = titleMatch?.[1]?.trim() || `Chapter ${chapterNum}`;

  return {
    meta: { number: chapterNum, title, fileName: `chapter-${padded}.md` },
    content,
  };
}

export function getBooksDir(): string {
  return BOOKS_DIR;
}
