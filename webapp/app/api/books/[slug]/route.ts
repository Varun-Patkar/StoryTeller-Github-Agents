import { NextResponse } from "next/server";
import { existsSync, rmSync } from "fs";
import path from "path";

const BOOKS_DIR = path.resolve(process.cwd(), "..", "books");

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Sanitize slug
  if (slug.includes("..") || slug.includes("/") || slug.includes("\\")) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const bookDir = path.join(BOOKS_DIR, slug);
  if (!bookDir.startsWith(BOOKS_DIR)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (!existsSync(bookDir)) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  rmSync(bookDir, { recursive: true, force: true });
  return NextResponse.json({ ok: true, deleted: slug });
}
