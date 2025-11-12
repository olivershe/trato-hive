# Run Unit Tests

Run unit tests for the specified scope:

Command: pnpm --filter {scope} test

If tests fail:
1. Display failure output
2. Analyze root cause
3. Suggest fixes
4. Update ERROR_LOG.md if bug discovered

If tests pass:
Display coverage report. Flag if <80% coverage for packages.
