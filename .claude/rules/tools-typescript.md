# Tools TypeScript Conventions

Applies when editing `tools/*.ts`.

## CJS Interop

AJV and ajv-formats are CJS packages. Under Node16 module resolution, use this pattern:

```typescript
import _Ajv from "ajv";
const Ajv = _Ajv as unknown as typeof _Ajv.default;
```

## ESM Setup

All tool scripts use ESM (`"type": "module"` in package.json). Use `fileURLToPath(import.meta.url)` for path resolution, not `__dirname`.
