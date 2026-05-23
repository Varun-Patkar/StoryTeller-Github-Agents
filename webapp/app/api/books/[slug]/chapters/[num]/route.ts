import { NextResponse } from "next/server";
import { existsSync, rmSync } from "fs";
import path from "path";

const BOOKS_DIR = path.resolve(process.cwd(), "..", "books");

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; num: string }> }
) {
  const { slug, num } = await params;

  // Sanitize
  if (slug.includes("..") || slug.includes("/") || slug.includes("\\")) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const chapterNum = parseInt(num, 10);
  if (isNaN(chapterNum) || chapterNum < 1) {
    return NextResponse.json({ error: "Invalid chapter number" }, { status: 400 });
  }

  const padded = String(chapterNum).padStart(2, "0");
  const chapterPath = path.join(
    BOOKS_DIR,
    slug,
    "chapters",
    `chapter-${padded}.md`
  );

  if (!chapterPath.startsWith(BOOKS_DIR)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (!existsSync(chapterPath)) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  rmSync(chapterPath);
  return NextResponse.json({ ok: true, deleted: `chapter-${padded}.md` });
}
