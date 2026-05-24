import { readdirSync, copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const booksDir = resolve(__dirname, '..', '..', 'books');
const publicCoversDir = resolve(__dirname, '..', 'public', 'covers');

if (!existsSync(booksDir)) {
  console.log('No books directory found, skipping cover copy.');
  process.exit(0);
}

mkdirSync(publicCoversDir, { recursive: true });

const entries = readdirSync(booksDir, { withFileTypes: true });
let copied = 0;

for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const coverPath = join(booksDir, entry.name, `cover.${ext}`);
    if (existsSync(coverPath)) {
      const destDir = join(publicCoversDir, entry.name);
      mkdirSync(destDir, { recursive: true });
      copyFileSync(coverPath, join(destDir, `cover.${ext}`));
      copied++;
      break;
    }
  }
}

console.log(`Copied ${copied} cover image(s).`);
