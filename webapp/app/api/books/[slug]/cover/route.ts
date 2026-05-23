import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, stat } from "fs/promises";
import { join } from "path";
import { getBooksDir } from "@/lib/books";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function sanitizeSlug(slug: string): string | null {
  const safe = slug.replace(/[^a-z0-9-]/g, "");
  if (safe !== slug || safe.includes("..")) return null;
  return safe;
}

async function findCover(
  bookDir: string
): Promise<{ path: string; ext: string } | null> {
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    const p = join(bookDir, `cover.${ext}`);
    try {
      await stat(p);
      return { path: p, ext };
    } catch {}
  }
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const safeSlug = sanitizeSlug(slug);
  if (!safeSlug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

  const bookDir = join(getBooksDir(), safeSlug);
  const cover = await findCover(bookDir);

  if (!cover) {
    return NextResponse.json({ error: "No cover image" }, { status: 404 });
  }

  const data = await readFile(cover.path);
  const contentType =
    cover.ext === "jpg" || cover.ext === "jpeg"
      ? "image/jpeg"
      : cover.ext === "png"
        ? "image/png"
        : "image/webp";

  return new NextResponse(data, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const safeSlug = sanitizeSlug(slug);
  if (!safeSlug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

  const formData = await req.formData();
  const file = formData.get("cover");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate type
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Only JPG, PNG, and WebP images are allowed" },
      { status: 400 }
    );
  }

  // Validate size
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Image must be under 5MB" },
      { status: 400 }
    );
  }

  const bookDir = join(getBooksDir(), safeSlug);

  // Verify book directory exists
  try {
    await stat(bookDir);
  } catch {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  // Remove existing covers
  for (const existingExt of ["jpg", "jpeg", "png", "webp"]) {
    try {
      const { unlink } = await import("fs/promises");
      await unlink(join(bookDir, `cover.${existingExt}`));
    } catch {}
  }

  // Save new cover
  const buffer = Buffer.from(await file.arrayBuffer());
  const coverPath = join(bookDir, `cover.${ext}`);
  await writeFile(coverPath, buffer);

  // Update config.md Cover Image field
  try {
    const configPath = join(bookDir, "config.md");
    let configContent = await readFile(configPath, "utf-8");
    configContent = configContent.replace(
      /(\|\s*Cover Image\s*\|)\s*[^|]*\|/,
      `$1 cover.${ext} |`
    );
    await writeFile(configPath, configContent, "utf-8");
  } catch {}

  return NextResponse.json({ success: true, path: `cover.${ext}` });
}
