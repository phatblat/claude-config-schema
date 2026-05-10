# claude-config-schema

set export
set ignore-comments
set script-interpreter := ['bash', '-eu']
set quiet
set unstable

[script]
_default:
    just --list

#
# configuration recipes
#

# Install Node dependencies
[group('configuration')]
install:
    npm ci

# Remove generated artifacts and caches
[group('configuration')]
clean:
    rm -rf dist node_modules/.cache
    rm -rf generated/go/types.go generated/ts/src/types.ts
    rm -rf generated/python/claude_config/types.py generated/rust/src/types.rs

# Auto-format justfile and TypeScript tooling
[group('configuration')]
format:
    just --fmt
    npx prettier --write tools/ tsconfig.json

#
# checks recipes
#

# Lint all JSON Schema files in upstream/ and authored/
[group('checks')]
lint-schemas:
    npm run lint:schemas

# Check TypeScript tooling compiles
[group('checks')]
lint:
    npx tsc --noEmit

# Validate example configs against their schemas
[group('checks')]
validate-examples:
    npm run validate

# Check for drift between schemas and committed bindings
[group('checks')]
check-drift:
    npm run check-drift

#
# build recipes
#

# Generate typed bindings for all languages
[group('build')]
generate:
    npm run generate

# Build Go bindings
[group('build')]
build-go:
    cd generated/go && go build ./...

# Build TypeScript bindings
[group('build')]
build-ts:
    cd generated/ts && npm install --silent && npx tsc --noEmit

# Build Python bindings
[group('build')]
build-python:
    cd generated/python && pip install -e . && python -c "import claude_config"

# Build Rust bindings
[group('build')]
build-rust:
    cd generated/rust && cargo check

# Build all language bindings
[group('build')]
build: build-go build-ts build-python build-rust

#
# tests recipes
#

# Run the full CI validation pipeline
[group('tests')]
test: lint lint-schemas validate-examples check-drift build

#
# sync recipes
#

# Detect the latest Claude Code version from npm
[group('sync')]
detect-version:
    npm run detect-version

# Fetch upstream schemas from json.schemastore.org
[group('sync')]
sync-upstream:
    npm run sync-upstream

# Sync upstream schemas and regenerate all bindings
[group('sync')]
sync: sync-upstream generate
