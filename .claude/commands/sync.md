# Sync upstream schemas and regenerate bindings

Fetch the latest upstream schemas from json.schemastore.org, regenerate all language bindings, verify no drift, and commit the results.

## Steps

1. Run `just sync` to fetch upstream schemas and regenerate bindings
2. Run `just check-drift` to verify consistency
3. Run `just lint-schemas` to validate all schemas
4. If anything changed, commit with message format: `chore: sync upstream schemas (vX.Y.Z)`
5. Push to remote
