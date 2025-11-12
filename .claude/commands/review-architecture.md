# Architecture Review

<mode:plan>
Review the specified component for:

1. Security vulnerabilities (OWASP Top 10, auth/authz, input validation)
2. Performance issues (N+1 queries, missing indexes, blocking operations)
3. API correctness (RESTful conventions, error handling, response formats)
4. Architecture alignment (7-Layer Architecture, service boundaries, data ownership)
5. Code quality (TypeScript strictness, error handling, test coverage)

Return:
- Decision: Green (approve) / Yellow (concerns to address) / Red (blockers)
- Issues list with severity (Critical/High/Medium/Low)
- Recommendations with rationale
</mode:plan>
