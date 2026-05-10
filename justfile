# claude-config-schema

# List available recipes
default:
    @just --list

# --------------------------------------------------------------------------- #
# Setup
# --------------------------------------------------------------------------- #

# Install Node dependencies
install:
    npm ci

# --------------------------------------------------------------------------- #
# Schema operations
# --------------------------------------------------------------------------- #

# Lint all JSON Schema files in upstream/ and authored/
lint-schemas:
    npm run lint:schemas

# Validate example configs against their schemas
validate-examples:
    npm run validate

# Detect the latest Claude Code version from npm
detect-version:
    npm run detect-version

# Fetch upstream schemas from json.schemastore.org
sync-upstream:
    npm run sync-upstream

# --------------------------------------------------------------------------- #
# Code generation
# --------------------------------------------------------------------------- #

# Generate typed bindings for all languages
generate:
    npm run generate

# Check for drift between schemas and committed bindings
check-drift:
    npm run check-drift

# --------------------------------------------------------------------------- #
# Language builds
# --------------------------------------------------------------------------- #

# Build Go bindings
build-go:
    cd generated/go && go build ./...

# Build TypeScript bindings
build-ts:
    cd generated/ts && npm ci && npx tsc --noEmit

# Build Python bindings
build-python:
    cd generated/python && pip install -e . && python -c "import claude_config"

# Build Rust bindings
build-rust:
    cd generated/rust && cargo check

# Build all language bindings
build-all: build-go build-ts build-python build-rust

# --------------------------------------------------------------------------- #
# CI pipeline (mirrors validate-pr.yml)
# --------------------------------------------------------------------------- #

# Run the full CI validation pipeline
ci: lint-schemas validate-examples check-drift build-all

# --------------------------------------------------------------------------- #
# Sync + regenerate (mirrors sync-upstream.yml)
# --------------------------------------------------------------------------- #

# Sync upstream schemas and regenerate all bindings
sync: sync-upstream generate
