# Run E2E Tests

Run E2E test for the specified user flow:

Command: pnpm --filter web test:e2e --grep "{flow}"

For UI flows, capture screenshots at key steps.

If tests fail:
1. Display failure with screenshots
2. Analyze: Is this a test issue or a real bug?
3. Update ERROR_LOG.md if real bug
4. Suggest fix or test update

If tests pass:
Confirm flow working as expected.
