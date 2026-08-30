# Releasing Nice Code

Nice Code uses Release Please for version ownership and GitHub Actions for
cross-platform Rust binaries, GitHub Releases, and npm publication.

## One-time npm setup

In npm package settings for `@sayanmohsin/nice-code`, create a Trusted
Publisher with these values:

- Publisher: GitHub Actions
- User: `sayanmohsin`
- Repository: `nice-code`
- Workflow filename: `release.yml`
- Environment: `npm-publish`

The GitHub environment must use the same `npm-publish` name. No npm token is
stored in GitHub; the workflow publishes with OIDC provenance.

The release workflow also follows the Arqen setup for Release Please. Configure
the repository variable `RELEASE_APP_CLIENT_ID` and repository secret
`RELEASE_APP_PRIVATE_KEY` for the GitHub App used to open release PRs.

## Normal release

1. Merge changes to `main` using Conventional Commit-style intent where possible.
2. Release Please opens or updates a release PR.
3. Merge the release PR.
4. The release workflow builds macOS, Linux, and Windows binaries, uploads
   checksums, and publishes the matching npm version.

Package and engine versions must always match. The version contract check
rejects drift before a release can proceed.

## Retrying a release

Use **Actions → Release → Run workflow** and provide `publish_version`, such as
`0.1.4`. The workflow updates an existing GitHub Release when present and skips
npm publication if that version already exists.

The initial `v0.1.4` bootstrap uses this retry flow after Trusted Publishing is
configured.
