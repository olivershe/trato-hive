## 7. Logging Protocols

### CHANGELOG.md

**When to update:**
- User-visible changes (new features, UI updates, behavior changes)
- API contract changes (breaking or non-breaking)
- Database migrations
- Risky dependency upgrades (major versions, security patches)

**Format:**
```markdown
## [Unreleased]

### Added
- [Module] Description with rationale (#PR-link)

### Changed
- [Module] Description with rationale (#PR-link)

### Fixed
- [Module] Description with rationale (#PR-link)

### Security
- [Module] Description with rationale (#PR-link)
```

**Slash Command:** `/log:changelog {summary}`

### ERROR_LOG.md

**When to update:**
- Any runtime error discovered in production, staging, or local
- CI failures that require investigation
- Development errors that took >30min to resolve

**Format:**
```markdown
## [YYYY-MM-DD HH:MM] - {Component}

**Symptom:** Brief description of the error
**Reproduction:** Steps to reproduce
**Suspected Cause:** Root cause analysis
**Status:** Fixed | Investigating | Workaround
**Fix PR:** #link (if resolved)
```

**Slash Command:** `/log:error {symptom}`

### Automation & Enforcement

- Agents may use `/log:changelog` and `/log:error` to append entries
- PRs touching user-facing code or APIs require CHANGELOG entry
- PRs fixing bugs require ERROR_LOG entry
- CI will fail if logs are missing when required (checked via script)