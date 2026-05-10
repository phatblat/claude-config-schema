# Authored Schemas

Applies when touching files in `authored/`.

## Provenance required

Every authored schema must have a corresponding `_meta/<name>.meta.json` file with:

```json
{
  "sourceUrl": "https://code.claude.com/docs/en/...",
  "claudeCodeVersion": "2.1.138",
  "lastReviewed": "2026-05-10"
}
```

## Staleness

CI warns when `lastReviewed` falls more than three Claude Code minor versions behind current. When updating a schema, always bump `lastReviewed` and `claudeCodeVersion`.

## Source constraint

All authored schemas derive from public Claude Code documentation. No proprietary or reverse-engineered content.
