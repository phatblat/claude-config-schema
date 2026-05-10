# claude-config-schema

Versioned, multi-language source of truth for Claude Code's configuration types. Mirrors the JSON schemas Anthropic publishes, authors schemas for the surfaces they don't, and emits typed bindings to Go, TypeScript, Python, and Rust.

> **Status:** Pre-v0.1 — Phase 0 (Foundation)

## What this is

Claude Code has a large and growing configuration surface: `settings.json`, plugin manifests, skill frontmatter, agent frontmatter, `.mcp.json`, monitors, and more. Some surfaces have official JSON Schemas on json.schemastore.org; many don't.

This repo is a single place that:

1. **Mirrors** official upstream schemas with version history
2. **Authors** schemas for undocumented surfaces, with clear provenance
3. **Generates** typed bindings from the unified schema set
4. **Publishes** bindings to language registries (npm, PyPI, crates.io, Go module proxy)

## Repository layout

```
upstream/       — mirrored schemas from json.schemastore.org (never hand-edited)
authored/       — schemas written from public docs
examples/       — valid and invalid config files per surface
generated/      — typed bindings (committed, derived from schemas)
tools/          — sync, generation, and validation scripts
tests/          — smoke tests for each language binding
```

See [SPEC.md](SPEC.md) for the full design document.

## Supported surfaces

### Upstream (mirrored)

| Surface | Schema |
|---|---|
| `settings.json` | `upstream/settings.json` |
| Plugin manifest | `upstream/plugin-manifest.json` |

### Authored (from docs)

| Surface | Schema |
|---|---|
| Skill frontmatter | `authored/skill-frontmatter.json` |
| Agent frontmatter | `authored/agent-frontmatter.json` |
| `.mcp.json` | `authored/mcp-config.json` |
| Marketplace manifest | `authored/marketplace.json` |
| Monitors | `authored/monitors.json` |
| LSP config | `authored/lsp-config.json` |
| Output styles | `authored/output-style.json` |
| Plugin hooks | `authored/hooks-standalone.json` |

## Language bindings

| Language | Registry | Package |
|---|---|---|
| Go | Go module proxy | `github.com/phatblat/claude-config-schema/generated/go` |
| TypeScript | npm | `@phatblat/claude-code-config` |
| Python | PyPI | `claude-code-config` |
| Rust | crates.io | `claude-code-config` |

## Related tools

- [claude-code-setup](https://github.com/anthropics/claude-code-plugin-claude-code-setup) — Claude Code plugin for analyzing codebases and recommending automations (hooks, subagents, skills, MCP servers)
- [claude-md-management](https://github.com/anthropics/claude-code-plugin-claude-md-management) — Claude Code plugin for auditing and improving CLAUDE.md files
- [Gantry](https://github.com/phatblat/gantry) — Claude Code config management tool (primary consumer of these schemas)

## License

MIT License. See [LICENSE.md](LICENSE.md).
