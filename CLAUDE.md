# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Versioned, multi-language source of truth for Claude Code's configuration types. Mirrors upstream JSON schemas from json.schemastore.org, authors schemas for undocumented surfaces, and generates typed bindings for Go, TypeScript, Python, and Rust via quicktype.

## Commands

```bash
just test              # Full CI pipeline: lint, schema lint, example validation, drift check, all builds
just build             # Build all four language bindings
just sync              # Fetch upstream schemas + regenerate bindings
just generate          # Regenerate bindings from current schemas
just check-drift       # Verify committed generated/ matches fresh generation
just lint              # Type-check tooling TypeScript (tsc --noEmit)
just lint-schemas      # Validate JSON Schema files with AJV
just clean             # Remove generated type files and caches
just format            # Auto-format justfile and TypeScript tooling
```

## Architecture

### Two-stream schema model

- `upstream/` — Mirrored from json.schemastore.org. Never hand-edited. Owned by `sync-upstream.ts`.
- `authored/` — Written from public Claude Code docs. Each has a `_meta/*.meta.json` provenance file.

### Unidirectional pipeline

```
upstream/ + authored/  →  generate-bindings.ts (quicktype)  →  generated/{go,ts,python,rust}/
```

Generated code is committed intentionally (same convention as protobuf/OpenAPI). Drift between schemas and committed bindings is a CI failure.

### Key tool scripts (`tools/`)

| Script | Purpose |
|---|---|
| `sync-upstream.ts` | Fetch schemas, SHA-256 hash, version-track in `upstream/history/` |
| `generate-bindings.ts` | Run quicktype per language, write scaffold files (go.mod, pyproject.toml, etc.) |
| `check-drift.ts` | Regenerate to temp dir, diff against committed `generated/` |
| `validate-examples.ts` | Assert valid/ examples pass and invalid/ examples fail against schemas |
| `lint-schemas.ts` | Compile each schema with AJV to verify it's valid JSON Schema |
| `detect-cc-version.ts` | Query npm registry for latest `@anthropic-ai/claude-code` version |

### `GENERATE_OUTPUT_DIR` env var

`generate-bindings.ts` respects this to redirect output (used by `check-drift.ts` to write to a temp dir without touching the repo).
