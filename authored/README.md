# Authored schemas

This directory contains JSON Schemas written from public Claude Code documentation
for configuration surfaces that don't have an official upstream schema.

Each schema has a corresponding metadata file in `_meta/` recording:
- The documentation URL it derives from
- The Claude Code version it was last reviewed against
- The date of last review

## Staleness detection

CI flags schemas whose `lastReviewed` date falls more than three Claude Code minor
versions behind the current release. This is a warning, not a failure — the schema
is allowed but should be re-reviewed.
