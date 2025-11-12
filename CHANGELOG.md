# Changelog

All notable changes to Trato Hive will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- [Setup] Initial project structure with hybrid monorepo
- [Setup] Claude Code governance with root CLAUDE.md and nested CLAUDE.md files
- [Setup] The Intelligent Hive design system (color tokens, typography, components)
- [Setup] 7-Layer Architecture documentation and mapping
- [Setup] 5 Core Modules structure (command-center, discovery, deals, diligence, generator)

### Changed

### Fixed

### Security

## Guidelines

### When to update CHANGELOG.md
- User-visible changes (new features, UI updates, behavior changes)
- API contract changes (breaking or non-breaking)
- Database migrations
- Risky dependency upgrades (major versions, security patches)

### Format
```markdown
### [Added/Changed/Fixed/Security]
- [Module] Description with rationale (#PR-link)
```

### Examples
- [Deals] Implement Verifiable Fact Sheet with citation links (#123)
- [API] Add pagination to /api/v1/deals endpoint (#145)
- [Security] Upgrade express to 4.18.3 to fix CVE-2024-XXXX (#167)
