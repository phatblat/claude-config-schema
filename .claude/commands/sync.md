# Sync upstream schemas and regenerate bindings

Fetch the latest upstream schemas from json.schemastore.org, regenerate all language bindings, validate, and commit the results.

## Steps

1. Run `just sync` to fetch upstream schemas and regenerate bindings
2. Run `just test` to validate schemas, examples, drift, and builds
3. If anything changed, commit with message format: `chore: sync upstream schemas (vX.Y.Z)`
4. Push to remote
