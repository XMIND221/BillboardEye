# Features Architecture (progressive migration)

This directory introduces a feature-oriented structure without breaking existing imports.

Current code still lives in `src/screens`, `src/services`, `src/contexts`, and `src/navigation`.
Feature barrels in this folder provide a stable, domain-based entrypoint for new code.

## Domains

- `auth/`
- `campaigns/`
- `panneaux/`
- `missions/`
- `reporting/`
- `navigation/`
- `performance/`

## Migration rule

When touching an existing module, prefer importing from `src/features/<domain>` first.
Then gradually move implementation files behind these barrels.

This keeps the app stable while improving discoverability and long-term maintainability.
