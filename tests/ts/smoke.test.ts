import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Convert } from "../../generated/ts/src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, "..", "..", "examples");

function readExample(path: string): string {
  return readFileSync(join(examplesDir, path), "utf-8");
}

let failures = 0;

function assert(condition: boolean, msg: string): void {
  if (!condition) {
    console.error(`FAIL: ${msg}`);
    failures++;
  }
}

// Settings round-trip
const settingsJson = readExample("settings/valid/minimal.json");
const settings = Convert.toClaudeCodeSettings(settingsJson);
const settingsOut = Convert.claudeCodeSettingsToJson(settings);
const settingsParsed = JSON.parse(settingsOut);
assert(
  settingsParsed.permissions?.defaultMode === "default",
  "settings round-trip: defaultMode should be 'default'"
);

// Plugin manifest round-trip
const pluginJson = readExample("plugins/valid/full-metadata.json");
const plugin = Convert.toClaudeCodePluginManifest(pluginJson);
const pluginOut = Convert.claudeCodePluginManifestToJson(plugin);
const pluginParsed = JSON.parse(pluginOut);
assert(
  pluginParsed.name === "code-review-helper",
  "plugin round-trip: name should be 'code-review-helper'"
);
assert(
  pluginParsed.version === "1.2.0",
  "plugin round-trip: version should be '1.2.0'"
);
assert(
  pluginParsed.license === "MIT",
  "plugin round-trip: license should be 'MIT'"
);

// Permissions example
const permJson = readExample("settings/valid/permissions-full.json");
const perm = Convert.toClaudeCodeSettings(permJson);
const permOut = Convert.claudeCodeSettingsToJson(perm);
const permParsed = JSON.parse(permOut);
assert(
  Array.isArray(permParsed.permissions?.allow),
  "permissions: allow should be an array"
);
assert(
  Array.isArray(permParsed.permissions?.deny),
  "permissions: deny should be an array"
);

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed`);
  process.exit(1);
} else {
  console.log("All smoke tests passed");
}
