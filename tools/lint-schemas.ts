#!/usr/bin/env tsx
// Copyright Ben Chatelain. Apache 2.0

/**
 * Validates that all JSON Schema files in upstream/ and authored/ are
 * syntactically valid JSON and valid JSON Schema (draft-07 / 2019-09 / 2020-12).
 *
 * Exit 0 when every file passes, 1 when any file fails.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import _Ajv from "ajv";
import _addFormats from "ajv-formats";

const Ajv = _Ajv as unknown as typeof _Ajv.default;
const addFormats = _addFormats as unknown as typeof _addFormats.default;

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

const toolsDir = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = join(toolsDir, "..");

// ---------------------------------------------------------------------------
// Collect schema files
// ---------------------------------------------------------------------------

/** Return top-level .json files in a directory (non-recursive). */
function jsonFilesIn(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter((name) => name.endsWith(".json"))
      .filter((name) => {
        const full = join(dir, name);
        return statSync(full).isFile();
      })
      .map((name) => join(dir, name));
  } catch {
    // Directory may not exist yet — not an error.
    return [];
  }
}

function collectFiles(): string[] {
  const files: string[] = [];

  // upstream/ — top-level only, skip history/
  files.push(...jsonFilesIn(join(repoRoot, "upstream")));

  // authored/ — top-level only, skip _meta/
  files.push(...jsonFilesIn(join(repoRoot, "authored")));

  return files;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

interface LintResult {
  file: string;
  ok: boolean;
  errors: string[];
}

function lintFile(filePath: string, ajv: InstanceType<typeof Ajv>): LintResult {
  const rel = relative(repoRoot, filePath);
  const result: LintResult = { file: rel, ok: true, errors: [] };

  // 1. Parse JSON
  let schema: unknown;
  try {
    const raw = readFileSync(filePath, "utf-8");
    schema = JSON.parse(raw);
  } catch (err) {
    result.ok = false;
    result.errors.push(
      `JSON parse error: ${err instanceof Error ? err.message : String(err)}`
    );
    return result;
  }

  // 2. Must be an object (JSON Schema is always an object or boolean)
  if (typeof schema !== "object" && typeof schema !== "boolean") {
    result.ok = false;
    result.errors.push(
      `Expected a JSON object or boolean, got ${typeof schema}`
    );
    return result;
  }

  // 3. Validate as JSON Schema by attempting to compile it
  try {
    ajv.compile(schema as Record<string, unknown>);
  } catch (err) {
    result.ok = false;
    const message = err instanceof Error ? err.message : String(err);
    result.errors.push(`Schema validation error: ${message}`);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const files = collectFiles();

  if (files.length === 0) {
    console.log("No schema files found to lint.");
    process.exit(0);
  }

  // Configure Ajv to accept multiple meta-schema drafts
  const ajv = new Ajv({
    allErrors: true,
    strict: false, // lenient — don't reject unknown keywords
    validateSchema: true,
  });
  addFormats(ajv);

  let failures = 0;

  for (const file of files) {
    const result = lintFile(file, ajv);

    if (result.ok) {
      console.log(`PASS  ${result.file}`);
    } else {
      failures++;
      console.log(`FAIL  ${result.file}`);
      for (const err of result.errors) {
        console.log(`      ${err}`);
      }
    }
  }

  console.log();
  console.log(`${files.length} file(s) checked, ${failures} failure(s).`);

  process.exit(failures > 0 ? 1 : 0);
}

main();
