# Error Log

This document tracks all runtime errors, development errors, and CI failures for debugging and learning purposes.

## Guidelines

### When to update ERROR_LOG.md
- Any runtime error discovered in production, staging, or local
- CI failures that require investigation
- Development errors that took >30min to resolve

### Format
```markdown
## [YYYY-MM-DD HH:MM] - {Component}

**Symptom:** Brief description of the error
**Reproduction:** Steps to reproduce
**Suspected Cause:** Root cause analysis
**Status:** Fixed | Investigating | Workaround
**Fix PR:** #link (if resolved)
```

## Entries

---

_No errors logged yet_
