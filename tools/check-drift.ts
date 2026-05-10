#!/usr/bin/env tsx
// Copyright Ben Chatelain. Apache 2.0

/**
 * Checks that the committed `generated/` directory matches what the
 * generation pipeline would produce from scratch.
 *
 * Steps:
 *   1. Create a temporary directory.
 *   2. Run `generate-bindings.ts` with GENERATE_OUTPUT_DIR pointing at the
 *      temp directory so all output lands there.
 *   3. Recursively diff the temp output against the committed `generated/`.
 *   4. Print any differences and exit 1, or print "No drift detected" and
 *      exit 0.
 *   5. Clean up the temp directory.
 */

import { execSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const COMMITTED_DIR = join(PROJECT_ROOT, "generated");
const GENERATE_SCRIPT = join(PROJECT_ROOT, "tools", "generate-bindings.ts");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTempDir(): string {
  return mkdtempSync(join(tmpdir(), "check-drift-"));
}

function cleanUp(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup — don't fail the script over this.
    console.warn(`Warning: failed to clean up temp directory: ${dir}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  // Guard: generate-bindings.ts must exist
  if (!existsSync(GENERATE_SCRIPT)) {
    console.error(
      `Error: generate-bindings.ts not found at ${GENERATE_SCRIPT}`
    );
    console.error(
      "The generation script must exist before drift checking is possible."
    );
    process.exit(1);
  }

  const tempDir = createTempDir();
  const tempGenerated = join(tempDir, "generated");

  try {
    // Step 1 — Run the generation pipeline into the temp directory.
    console.log("Running generation pipeline...");
    execSync(`npx tsx ${GENERATE_SCRIPT}`, {
      cwd: PROJECT_ROOT,
      stdio: "pipe",
      env: {
        ...process.env,
        GENERATE_OUTPUT_DIR: tempGenerated,
      },
    });

    // Step 2 — Diff the freshly generated output against committed files.
    console.log("Comparing generated output with committed files...");

    // Ensure both directories exist before diffing.
    if (!existsSync(tempGenerated)) {
      console.error(
        "Error: generation pipeline did not produce any output in " +
          tempGenerated
      );
      process.exit(1);
    }

    if (!existsSync(COMMITTED_DIR)) {
      console.error(
        `Error: committed directory does not exist: ${COMMITTED_DIR}`
      );
      process.exit(1);
    }

    let diffOutput: string;
    try {
      diffOutput = execSync(`diff -r "${tempGenerated}" "${COMMITTED_DIR}"`, {
        cwd: PROJECT_ROOT,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (err: unknown) {
      // `diff -r` exits 1 when differences exist and 2 on errors.
      if (
        err !== null &&
        typeof err === "object" &&
        "status" in err &&
        "stdout" in err
      ) {
        const execErr = err as {
          status: number;
          stdout: string;
          stderr: string;
        };
        if (execErr.status === 1) {
          // Differences found.
          diffOutput = execErr.stdout;
        } else {
          // diff itself encountered an error.
          console.error("diff command failed:");
          console.error(execErr.stderr || execErr.stdout);
          process.exit(2);
        }
      } else {
        throw err;
      }
    }

    // Step 3 — Report results.
    if (!diffOutput || diffOutput.trim().length === 0) {
      console.log("No drift detected.");
      process.exit(0);
    }

    console.error(
      "Drift detected between generated output and committed files:\n"
    );
    console.error(diffOutput);
    console.error(
      "\nRe-run `npm run generate` and commit the updated generated/ directory."
    );
    process.exit(1);
  } finally {
    cleanUp(tempDir);
  }
}

main();
