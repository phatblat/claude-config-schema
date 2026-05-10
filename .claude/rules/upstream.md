# Upstream Schemas

Applies when touching files in `upstream/`.

## Never hand-edit

Files in `upstream/` are owned by `tools/sync-upstream.ts`. They are fetched from json.schemastore.org, hashed, and version-tracked automatically. Manual edits will be overwritten on next sync.

To update upstream schemas, run `just sync-upstream`.
