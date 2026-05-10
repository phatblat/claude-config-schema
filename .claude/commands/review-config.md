# Review Claude Code configuration

Audit the project's `.claude/` directory and `CLAUDE.md` for best practices and improvement opportunities.

## Steps

1. Read `CLAUDE.md` and evaluate:
   - Is it concise and high-signal? (no generic advice, no duplicated content from rules)
   - Does the commands table match `just --list` output?
   - Does the architecture section reflect the current codebase?

2. Read each file in `.claude/rules/` and evaluate:
   - Is each rule scoped to a specific area (file pattern or directory)?
   - Are any rules stale or contradicted by current code?
   - Are there conventions in CLAUDE.md that should be rules instead?

3. Read each file in `.claude/commands/` and evaluate:
   - Does each command have clear steps?
   - Are there common multi-step workflows not yet captured as commands?

4. Check for missing automation opportunities:
   - Are there repetitive tasks that should be hooks in `.claude/settings.json`?
   - Are there file-type-specific conventions not yet captured as rules?

5. Report findings as a checklist: what's good, what needs updating, what's missing.
