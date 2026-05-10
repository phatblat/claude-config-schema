#!/usr/bin/env tsx
// Copyright Ben Chatelain. Apache 2.0

/**
 * Detects the latest Claude Code version from the npm registry.
 *
 * Prints the version to stdout. When running in GitHub Actions,
 * also sets it as a step output (`version`).
 */

const REGISTRY_URL =
  "https://registry.npmjs.org/@anthropic-ai/claude-code/latest";

interface NpmPackageLatest {
  version: string;
}

async function main(): Promise<void> {
  const response = await fetch(REGISTRY_URL);

  if (!response.ok) {
    throw new Error(
      `npm registry returned ${response.status}: ${response.statusText}`
    );
  }

  const data = (await response.json()) as NpmPackageLatest;
  const { version } = data;

  if (!version) {
    throw new Error("Response missing 'version' field");
  }

  console.log(version);

  // Set GitHub Actions step output when running in CI
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    const { appendFileSync } = await import("node:fs");
    appendFileSync(outputFile, `version=${version}\n`);
  }
}

main().catch((error: unknown) => {
  console.error(
    "Failed to detect Claude Code version:",
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
