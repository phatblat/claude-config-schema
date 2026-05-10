# claude-code-config-schema

A versioned, multi-language source of truth for Claude Code's configuration types. Mirrors the JSON schemas Anthropic publishes, authors schemas for the surfaces they don't, and emits typed bindings to Go, TypeScript, Python, and Rust.

> **Status:** Draft spec, pre-v0.1
> **Working name:** `claude-code-config-schema` (see [Open questions](#open-questions))
> **Primary consumer at launch:** Gantry (Claude Code config management tool)

---

## Motivation

Claude Code's configuration is large and growing. The official `settings.json` schema alone covers ~125 properties across permissions, hooks (5 handler types, ~30 events), MCP servers, sandboxing, plugins, marketplaces, and ~175 environment variables. Plugin manifests, skill frontmatter, agent frontmatter, `.mcp.json`, monitor configs, and others form their own surfaces. Anyone building tooling for Claude Code today either rolls their own validators per surface, or relies on stringly-typed JSON parsing and hopes for the best.

Anthropic publishes JSON Schemas for some of this surface (`settings.json`, `plugin-manifest.json`) on json.schemastore.org. Other surfaces are documented but not formally schema'd. There's no language-binding story — consumers in Go, TS, Python, or Rust write their own struct definitions or import nothing.

This project closes that gap. It's a single repository that:

1. Mirrors and version-tracks the official upstream schemas
2. Authors schemas for the surfaces Anthropic doesn't yet publish, with clear provenance
3. Generates typed bindings in multiple languages from the unified schema set
4. Publishes those bindings to language registries on a coherent semver

The result: any tool building on Claude Code's config can `import`/`go get`/`pip install`/`cargo add` typed access to the entire configuration surface, with confidence that the types are kept current as Claude Code evolves.

---

## Goals

- **Single source of truth.** Every Claude Code config surface has exactly one schema in this repo, regardless of whether it was mirrored or authored here.
- **Provenance is explicit.** Every schema declares where it came from (upstream URL or docs page + Claude Code version). Mixed origin is fine; conflated origin is not.
- **Versioned and historical.** Old Claude Code versions remain validatable. A consumer can say "validate this config against Claude Code 2.1.130" and get a meaningful answer.
- **Multi-language bindings without per-language schema drift.** Bindings are derived; the JSON Schema is canonical. No hand-maintained Go structs.
- **Living examples.** Every schema has a corpus of valid and invalid example files that double as regression tests and onboarding material.
- **Independent of Claude Code's release cadence.** This repo's semver tracks its own changes, not Claude Code's. New Claude Code releases that don't change config shape are a no-op.
- **Low maintenance burden per release.** Upstream sync is automated; authored schema updates are manual but rare.

## Non-goals

- **Not a runtime validator.** This repo ships schemas and bindings, not a CLI to validate files. Consumers (Gantry, editor extensions, etc.) compose schemas with their preferred validator.
- **Not a Claude Code SDK.** No API client, no session management, no command construction. Config types only.
- **Not a docs replacement.** Schemas link back to canonical docs; they don't try to reproduce explanations.
- **Not a vendored copy of MCP.** `.mcp.json` is a thin Claude Code wrapper around the standard MCP server config; we model the wrapper, not the entire MCP protocol.
- **No proprietary or scraped-from-binary content.** All authored schemas derive from public docs. Mirrored schemas come from json.schemastore.org with attribution.

---

## Concepts and terminology

- **Surface.** A config file or fragment with a defined shape. `settings.json` is one surface. Skill frontmatter is another. The plugin manifest is another.
- **Upstream schema.** A JSON Schema mirrored from an Anthropic-controlled source (currently json.schemastore.org). Untouched in this repo.
- **Authored schema.** A JSON Schema written in this repo to cover a surface that has no upstream. Hand-maintained from docs.
- **Provenance.** Metadata recording where a schema came from, when it was retrieved or last reviewed, and which Claude Code version it tracks.
- **Binding.** A language-specific typed representation generated from the schema set. Each supported language gets one published artifact.
- **Drift.** A mismatch between schemas and committed bindings. Detected in CI; blocks merge.

---

## Architecture

The repo separates concerns by directory rather than by repository. Mirrored schemas, authored schemas, examples, generated bindings, and tooling all coexist in one tree but never blur into each other.

The pipeline is unidirectional:

```
upstream/        authored/
    \              /
     \            /
      [generation pipeline]
              |
              v
       generated/{go,ts,python,rust}/
              |
              v
       publishing workflows
              |
              v
   npm / PyPI / crates.io / Go module proxy
```

Schemas in `upstream/` and `authored/` are the source of truth. `generated/` is fully derived. Drift between schema changes and committed bindings is a CI failure.

### Schema sources

**Upstream** schemas are pulled by an automated workflow on a schedule (and on demand). The workflow detects the current Claude Code version from the `@anthropic-ai/claude-code` npm package, fetches each known upstream schema URL, hashes it, and compares against the most recent entry in `upstream/history/`. If different, the new copy is written to history and the latest pointer is updated. A pull request is opened for human review — auto-merge is intentionally not used.

**Authored** schemas are written by hand from public Claude Code documentation. Each has an associated `_meta/<name>.meta.json` file recording: the docs URL it derives from, the Claude Code version it was last reviewed against, and a `lastReviewed` ISO date. CI flags authored schemas whose `lastReviewed` falls more than three Claude Code minor versions behind current — they're due for re-review.

### Composition

Several authored schemas reference upstream definitions. Agent frontmatter's `hooks` field reuses the `hookMatcher` definition from `upstream/settings.json`. Plugin manifest's `userConfig` is referenced by other authored fields. `$ref` resolution stays within the repo using relative paths, so the entire schema set is self-contained.

---

## Repository structure

```
claude-code-config-schema/
├── README.md
├── LICENSE                          # Apache-2.0 or MIT
├── NOTICE                           # attribution for upstream-mirrored schemas
├── CHANGELOG.md
├── package.json                     # tooling deps (TS-based generation)
│
├── upstream/                        # mirrored — never hand-edited
│   ├── README.md
│   ├── settings.json                # latest-pointer copy
│   ├── plugin-manifest.json
│   └── history/
│       ├── manifest.json            # full version index across all upstream schemas
│       ├── settings/
│       │   ├── 2.1.138.json
│       │   └── ...
│       └── plugin-manifest/
│           └── ...
│
├── authored/                        # written from docs
│   ├── README.md
│   ├── skill-frontmatter.json
│   ├── agent-frontmatter.json
│   ├── mcp-config.json              # .mcp.json
│   ├── marketplace.json
│   ├── monitors.json
│   ├── lsp-config.json
│   ├── output-style.json
│   ├── hooks-standalone.json        # for plugin hooks/hooks.json
│   └── _meta/
│       ├── skill-frontmatter.meta.json
│       └── ...
│
├── examples/
│   ├── settings/{valid,invalid}/
│   ├── agents/{valid,invalid}/
│   ├── skills/{valid,invalid}/
│   ├── plugins/{valid,invalid}/
│   └── ...
│
├── generated/                       # committed; reviewed in PRs
│   ├── go/{go.mod, *.go}
│   ├── ts/{package.json, src/}
│   ├── python/{pyproject.toml, claude_config/}
│   └── rust/{Cargo.toml, src/}
│
├── tests/                           # smoke tests for each binding
│   ├── go/, ts/, python/, rust/
│
├── tools/
│   ├── sync-upstream.ts
│   ├── detect-cc-version.ts
│   ├── generate-bindings.ts
│   ├── validate-examples.ts
│   └── check-drift.ts
│
└── .github/workflows/
    ├── sync-upstream.yml
    ├── validate-pr.yml
    ├── regenerate.yml
    └── release.yml
```

---

## Schema inventory

### Upstream (known to be officially published)

| Schema | URL | Status |
|---|---|---|
| `settings.json` | `https://json.schemastore.org/claude-code-settings.json` | Confirmed, draft-07 |
| `plugin-manifest.json` | `https://json.schemastore.org/claude-code-plugin-manifest.json` | Referenced in docs; verify on first sync |

### Authored (planned)

| Schema | Source | Notes |
|---|---|---|
| `skill-frontmatter.json` | `code.claude.com/docs/en/skills` | YAML frontmatter for skill files |
| `agent-frontmatter.json` | `code.claude.com/docs/en/sub-agents` | 15 fields documented; reuses upstream hook + MCP defs |
| `mcp-config.json` | `code.claude.com/docs/en/mcp` | `.mcp.json` files; wraps MCP server entry shape |
| `marketplace.json` | `code.claude.com/docs/en/plugin-marketplaces` | Plugin marketplace manifest |
| `monitors.json` | `code.claude.com/docs/en/plugins-reference#monitors` | Background monitor configs |
| `lsp-config.json` | `code.claude.com/docs/en/plugins-reference#lsp-servers` | LSP server entries |
| `output-style.json` | `code.claude.com/docs/en/output-styles` | Output style frontmatter |
| `hooks-standalone.json` | `code.claude.com/docs/en/plugins-reference#hooks` | Plugin `hooks/hooks.json` (subset of settings hooks) |

---

## Generation pipeline

For v0.1, **quicktype** is the single generator across all languages. It accepts JSON Schema input and emits idiomatic types per language.

The pipeline:

1. Collect all schemas from `upstream/` (latest pointers only) and `authored/`.
2. Resolve internal `$ref`s into a working set.
3. For each language: run quicktype with language-specific config (package name, naming style, derives/decorators).
4. Apply post-processing: license header, generated-by comment, format with the language's standard formatter.
5. Write to `generated/<lang>/`.
6. Build a smoke test in `tests/<lang>/` that imports the generated types and validates an example.

`tools/check-drift.ts` runs this entire pipeline into a temp directory and diffs against committed `generated/`. Non-empty diff fails CI.

---

## Versioning policy

The repo carries its own semver, independent of Claude Code's.

| Change type | Bump |
|---|---|
| New authored schema added | MINOR |
| Upstream schema sync with new fields, no removals | MINOR |
| Backward-compatible authored schema additions | MINOR |
| Hand-fix to authored schema, no shape change | PATCH |
| Generator config tweaks affecting binding output | PATCH (or MINOR if user-visible) |
| Renamed or removed field in authored schema | MAJOR |
| Upstream removes a field (breaking) | MAJOR |
| Generator replacement that changes generated API | MAJOR |

Pre-1.0 (v0.x), MINOR may include breaking changes per semver convention.

---

## Distribution

| Language | Registry | Path |
|---|---|---|
| Go | Go module proxy via tags | `github.com/phatblat/claude-config-schema/generated/go` |
| TypeScript | npm | `@phatblat/claude-code-config` |
| Python | PyPI | `claude-code-config` |
| Rust | crates.io | `claude-code-config` |

---

## CI/CD

**`sync-upstream.yml`** — daily cron + manual dispatch. Detects Claude Code version, fetches upstream schemas, opens PR if changed.

**`validate-pr.yml`** — every PR. Lints schemas, validates examples, compiles bindings, checks drift.

**`regenerate.yml`** — manual dispatch. Runs generation pipeline and commits results.

**`release.yml`** — triggers on `v*.*.*` tag push. Publishes bindings to registries.

---

## Roadmap

### Phase 0 — Foundation (S)
Repo skeleton, CI scaffolding, license, tooling dependencies.

### Phase 1 — Settings + Go bindings (M)
Mirror `settings.json`, generate Go types, publish v0.1.0.

### Phase 2 — Plugin manifest + first authored schemas (M)
Mirror plugin manifest, author skill/agent/mcp-config schemas, publish v0.2.0.

### Phase 3 — Remaining authored schemas + drift hardening (M)
Full surface coverage, CI maturity, publish v0.3.0.

### Phase 4 — Multi-language bindings (L)
TypeScript, Python, Rust bindings, publish v1.0.0.

### Phase 5 — Ergonomics and stewardship (ongoing)
Per-language generator improvements, docs site, contribution guide.

---

## Open questions

1. **Go publishing path.** Nested `go.mod` vs. mirror-push to sibling repo.
2. **Schema format.** Stay on JSON Schema for v0.1. Re-evaluate TypeSpec later.
3. **Anthropic relationship.** Worth a heads-up to coordinate.
4. **Test corpus sourcing.** Need sanitized real-world configs.
5. **Backwards-compat policy.** In-place updates pre-v1.0, additive-only post-v1.0.
