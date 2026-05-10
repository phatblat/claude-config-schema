# Generated Bindings

Applies when touching files in `generated/`.

## Never hand-edit

All files in `generated/` are produced by `tools/generate-bindings.ts`. Manual edits will be overwritten on next generation and flagged by `check-drift`.

To change project manifests (`go.mod`, `pyproject.toml`, `Cargo.toml`, `package.json`, `tsconfig.json`), update the `scaffoldFiles` config in `tools/generate-bindings.ts`.

To change generated types, modify the source schema in `upstream/` or `authored/` and run `just generate`.

## TypeScript strict: false

The generated TS tsconfig uses `strict: false` because quicktype emits index signatures incompatible with strict mode. Don't change this.
