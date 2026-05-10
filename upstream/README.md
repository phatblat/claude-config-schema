# Upstream schemas

This directory contains JSON Schemas mirrored from Anthropic-controlled sources.

**These files are never hand-edited.** They are fetched by `tools/sync-upstream.ts`
and committed via automated PRs.

## Layout

- `settings.json` — latest-pointer copy of the settings schema
- `plugin-manifest.json` — latest-pointer copy of the plugin manifest schema
- `history/manifest.json` — version index tracking all fetched schema versions
- `history/<surface>/<version>.json` — historical copies keyed by Claude Code version

## Sources

| Schema | URL |
|---|---|
| settings.json | https://json.schemastore.org/claude-code-settings.json |
| plugin-manifest.json | https://json.schemastore.org/claude-code-plugin-manifest.json |
