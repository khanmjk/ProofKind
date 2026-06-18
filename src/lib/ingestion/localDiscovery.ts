import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { isSupportedDocumentPath } from "@/lib/ingestion/documentParser";

export type DiscoveredLocalFile = {
  absolutePath: string;
  relativePath: string;
  size: number;
  modifiedAt: string;
};

type DiscoverOptions = {
  maxFiles: number;
};

const SKIPPED_DIRECTORIES = new Set([
  ".git",
  ".next",
  ".Trash",
  ".tmp",
  "node_modules",
  "Library",
  "Applications"
]);

function shouldSkipDirectory(name: string) {
  return name.startsWith(".") || SKIPPED_DIRECTORIES.has(name);
}

export async function discoverLocalFiles(rootPath: string, options: DiscoverOptions) {
  const discovered: DiscoveredLocalFile[] = [];

  async function walk(currentPath: string) {
    if (discovered.length >= options.maxFiles) return;

    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      if (discovered.length >= options.maxFiles) return;

      const absolutePath = join(currentPath, entry.name);

      if (entry.isDirectory()) {
        if (!shouldSkipDirectory(entry.name)) {
          await walk(absolutePath);
        }
        continue;
      }

      if (!entry.isFile() || !isSupportedDocumentPath(entry.name)) continue;

      const stats = await stat(absolutePath);

      discovered.push({
        absolutePath,
        relativePath: relative(rootPath, absolutePath),
        size: stats.size,
        modifiedAt: stats.mtime.toISOString()
      });
    }
  }

  await walk(rootPath);
  return discovered;
}
