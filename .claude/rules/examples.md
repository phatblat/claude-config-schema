# Example Config Files

Applies when touching files in `examples/`.

## Dual-bucket convention

- `examples/<surface>/valid/` — must pass schema validation
- `examples/<surface>/invalid/` — must fail schema validation (if they pass, that's a test failure)

`tools/validate-examples.ts` enforces this. Run `just validate-examples` after adding or modifying examples.

## Minimum coverage

Each authored schema should have at least 3 valid and 2 invalid examples. Upstream schemas should have at least 5 valid examples.

## Content guidelines

Use realistic but sanitized configs. No real secrets, API keys, or internal hostnames.
