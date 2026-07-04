import { readdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const BOOKS_DIR = resolve(process.cwd(), '..', 'books');

/**
 * List the slugs of every book that has a knowledge-graph database. Used by the Brain
 * Viewer page's getStaticPaths so a viewer route is generated only for books that
 * actually have a graph snapshot.
 * @returns Array of book slugs that contain graph/graph.db.
 */
export function getGraphSlugs(): string[] {
  if (!existsSync(BOOKS_DIR)) return [];
  const slugs: string[] = [];
  for (const entry of readdirSync(BOOKS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (existsSync(join(BOOKS_DIR, entry.name, 'graph', 'graph.db'))) {
      slugs.push(entry.name);
    }
  }
  return slugs;
}

/**
 * Whether a specific book has a knowledge graph (used to conditionally show the
 * Brain View link on the book page).
 * @param slug Book slug.
 * @returns True if graph/graph.db exists for the book.
 */
export function hasGraph(slug: string): boolean {
  const safeSlug = slug.replace(/[^a-z0-9-]/g, '');
  return existsSync(join(BOOKS_DIR, safeSlug, 'graph', 'graph.db'));
}
