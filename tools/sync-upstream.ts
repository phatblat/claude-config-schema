#!/usr/bin/env tsx
// Copyright Ben Chatelain. Apache 2.0

/**
 * Syncs upstream JSON schemas from json.schemastore.org.
 *
 * For each known schema, fetches it, compares its SHA-256 hash against
 * the latest entry in upstream/history/manifest.json, and writes new
 * versions when changes are detected.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const UPSTREAM_DIR = join(PROJECT_ROOT, "upstream");
const HISTORY_DIR = join(UPSTREAM_DIR, "history");
const MANIFEST_PATH = join(HISTORY_DIR, "manifest.json");

const NPM_REGISTRY_URL =
  "https://registry.npmjs.org/@anthropic-ai/claude-code/latest";

interface UpstreamSchema {
  /** File name used for the latest-pointer copy and history sub-directory. */
  name: string;
  /** URL to fetch the schema from. */
  url: string;
}

const UPSTREAM_SCHEMAS: readonly UpstreamSchema[] = [
  {
    name: "settings.json",
    url: "https://json.schemastore.org/claude-code-settings.json",
  },
  {
    name: "plugin-manifest.json",
    url: "https://json.schemastore.org/claude-code-plugin-manifest.json",
  },
] as const;

// ---------------------------------------------------------------------------
// Manifest types
// ---------------------------------------------------------------------------

interface ManifestEntry {
  version: string;
  hash: string;
  fetchedAt: string;
}

/** Maps schema name → array of history entries (newest last). */
type Manifest = Record<string, ManifestEntry[]>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sha256(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex");
}

function readManifest(): Manifest {
  if (!existsSync(MANIFEST_PATH)) {
    return {};
  }
  const raw = readFileSync(MANIFEST_PATH, "utf-8");
  return JSON.parse(raw) as Manifest;
}

function writeManifest(manifest: Manifest): void {
  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `GET ${url} returned ${response.status}: ${response.statusText}`
    );
  }
  return response.text();
}

/**
 * Detect the current Claude Code version.
 *
 * Resolution order:
 *   1. `CLAUDE_CODE_VERSION` environment variable
 *   2. npm registry latest tag for @anthropic-ai/claude-code
 */
async function detectVersion(): Promise<string> {
  const envVersion = process.env.CLAUDE_CODE_VERSION;
  if (envVersion) {
    return envVersion;
  }

  const response = await fetch(NPM_REGISTRY_URL);
  if (!response.ok) {
    throw new Error(
      `npm registry returned ${response.status}: ${response.statusText}`
    );
  }
  const data = (await response.json()) as { version?: string };
  if (!data.version) {
    throw new Error("npm registry response missing 'version' field");
  }
  return data.version;
}

function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface SyncResult {
  schema: string;
  action: "updated" | "skipped";
  version?: string;
  hash?: string;
}

async function main(): Promise<void> {
  const manifest = readManifest();
  const results: SyncResult[] = [];

  // Lazily resolved — only fetched if at least one schema changed.
  let resolvedVersion: string | undefined;

  for (const schema of UPSTREAM_SCHEMAS) {
    const content = await fetchText(schema.url);
    const hash = sha256(content);

    const entries = manifest[schema.name] ?? [];
    const latest = entries.length > 0 ? entries[entries.length - 1] : undefined;

    if (latest && latest.hash === hash) {
      results.push({ schema: schema.name, action: "skipped" });
      continue;
    }

    // Schema changed (or first fetch) — resolve version once.
    if (resolvedVersion === undefined) {
      resolvedVersion = await detectVersion();
    }
    const version = resolvedVersion;

    // Derive the base name without .json for the history sub-directory.
    const baseName = schema.name.replace(/\.json$/, "");
    const historySchemaDir = join(HISTORY_DIR, baseName);
    ensureDir(historySchemaDir);

    // Write versioned history copy.
    const historyPath = join(historySchemaDir, `${version}.json`);
    writeFileSync(historyPath, content);

    // Write latest-pointer copy.
    const latestPath = join(UPSTREAM_DIR, schema.name);
    writeFileSync(latestPath, content);

    // Append manifest entry.
    const entry: ManifestEntry = {
      version,
      hash,
      fetchedAt: new Date().toISOString(),
    };
    if (!manifest[schema.name]) {
      manifest[schema.name] = [];
    }
    manifest[schema.name].push(entry);

    results.push({ schema: schema.name, action: "updated", version, hash });
  }

  // Persist manifest (even if nothing changed — harmless no-op).
  writeManifest(manifest);

  // Print summary.
  console.log("\n--- sync-upstream summary ---\n");
  for (const r of results) {
    if (r.action === "updated") {
      console.log(
        `  UPDATED  ${r.schema}  →  v${r.version}  (${r.hash?.slice(0, 12)}…)`
      );
    } else {
      console.log(`  skipped  ${r.schema}  (no changes)`);
    }
  }

  const updatedCount = results.filter((r) => r.action === "updated").length;
  if (updatedCount === 0) {
    console.log("\nNo upstream changes detected.");
  } else {
    console.log(`\n${updatedCount} schema(s) updated.`);
  }
}

main().catch((error: unknown) => {
  console.error(
    "sync-upstream failed:",
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
