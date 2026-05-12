#!/usr/bin/env tsx
// Copyright Ben Chatelain. Apache 2.0

/**
 * Validates example config files against their JSON Schemas.
 *
 * For each surface (settings, plugins, skills, agents, mcp):
 *   - Files in `examples/<surface>/valid/`   MUST pass validation.
 *   - Files in `examples/<surface>/invalid/` MUST fail validation.
 *
 * Exits 0 when all assertions hold, 1 otherwise.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import _Ajv from "ajv";
import type { ValidateFunction } from "ajv";
import _addFormats from "ajv-formats";

// CJS default-export interop for Node16 module resolution
const Ajv = _Ajv as unknown as typeof _Ajv.default;
const addFormats = _addFormats as unknown as typeof _addFormats.default;

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const EXAMPLES_DIR = join(ROOT, "examples");

// ---------------------------------------------------------------------------
// Schema mapping: surface name → schema file path (relative to ROOT)
// ---------------------------------------------------------------------------

const SCHEMA_MAP: Record<string, string> = {
  settings: "upstream/settings.json",
  plugins: "upstream/plugin-manifest.json",
  skills: "authored/skill-frontmatter.json",
  agents: "authored/agent-frontmatter.json",
  mcp: "authored/mcp-config.json",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ValidationResult {
  file: string;
  surface: string;
  expectValid: boolean;
  passed: boolean;
  errors?: string;
}

function listJsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => join(dir, f));
}

function formatErrors(validate: ValidateFunction): string {
  if (!validate.errors) return "";
  return validate.errors
    .map((e: { instancePath?: string; message?: string }) => {
      const path = e.instancePath || "/";
      return `  ${path}: ${e.message}`;
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  const results: ValidationResult[] = [];
  const surfaces = Object.keys(SCHEMA_MAP);
  let skippedSurfaces = 0;

  for (const surface of surfaces) {
    const schemaPath = join(ROOT, SCHEMA_MAP[surface]);

    // Skip surfaces whose schema file doesn't exist yet
    if (!existsSync(schemaPath)) {
      console.log(
        `skipped  ${surface}: schema not found (${relative(ROOT, schemaPath)})`
      );
      skippedSurfaces++;
      continue;
    }

    const schema = JSON.parse(readFileSync(schemaPath, "utf-8")) as Record<
      string,
      unknown
    >;
    const validate = ajv.compile(schema);

    // Process valid/ and invalid/ subdirectories
    for (const bucket of ["valid", "invalid"] as const) {
      const expectValid = bucket === "valid";
      const bucketDir = join(EXAMPLES_DIR, surface, bucket);
      const files = listJsonFiles(bucketDir);

      for (const filePath of files) {
        const data = JSON.parse(readFileSync(filePath, "utf-8")) as unknown;
        const isValid = validate(data) as boolean;
        const passed = expectValid ? isValid : !isValid;
        const rel = relative(ROOT, filePath);

        const result: ValidationResult = {
          file: rel,
          surface,
          expectValid,
          passed,
        };

        if (!passed) {
          result.errors = expectValid
            ? formatErrors(validate)
            : "Expected validation to fail, but it passed";
        }

        results.push(result);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Report
  // ---------------------------------------------------------------------------

  if (results.length === 0) {
    if (skippedSurfaces === surfaces.length) {
      console.log("\nNo schemas found yet — nothing to validate.");
    } else {
      console.log("\nNo example files found to validate.");
    }
    process.exit(0);
  }

  let failures = 0;

  for (const r of results) {
    const icon = r.passed ? "PASS" : "FAIL";
    const expectation = r.expectValid ? "should PASS" : "should FAIL";
    console.log(`${icon}  ${r.file} (${expectation})`);
    if (!r.passed && r.errors) {
      console.log(r.errors);
    }
    if (!r.passed) failures++;
  }

  console.log(`\n${results.length} file(s) checked, ${failures} failure(s).`);

  process.exit(failures > 0 ? 1 : 0);
}

main();
