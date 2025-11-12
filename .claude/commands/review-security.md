# Security Review

<mode:plan>
Security audit for the specified scope:

Checklist:
- [ ] Authentication: All protected routes require auth
- [ ] Authorization: RBAC implemented, row-level security enforced
- [ ] Input validation: Zod schemas used, XSS prevention, SQL injection prevention
- [ ] Secrets: No secrets in code, env vars used, no secrets in logs
- [ ] Encryption: AES-256 at rest, TLS 1.3 in transit
- [ ] Audit logging: All sensitive actions logged
- [ ] Rate limiting: API rate limits implemented
- [ ] CORS: Whitelist configured correctly

Return: Pass/Fail with specific issues and remediation steps.
</mode:plan>
