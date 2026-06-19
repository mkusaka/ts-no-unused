---
name: release-version
description: Release workflow for ts-no-unused. Use when Codex needs to bump the package version, create the release commit and tag, push them, verify GitHub Actions CI/Release, or check the npm staged publishing state for this repository.
---

# Release Version

## Workflow

Use `npm version` only with `--no-git-tag-version`.
Do not use plain `npm version patch`, because it creates the commit and tag
before the required staged diff/content secret scan can run.

1. Confirm the worktree is clean.

```sh
git status --short
```

2. Confirm the current npm package state.

```sh
npm view ts-no-unused version versions --json
```

3. Bump the version without commit/tag side effects.

Default to patch for this `0.0.x` package unless the user asks for a different
bump:

```sh
npm version patch --no-git-tag-version
```

4. Confirm the new version is not already published.

```sh
npm view ts-no-unused@<version> version
```

An `E404` result is expected for a new version.

5. Run local validation.

```sh
pnpm run check
pnpm run publish:dry
```

6. Stage only the release-version files, then run the required scanner.

```sh
git add package.json pnpm-lock.yaml
~/.codex/bin/codex-secret-scan
```

If additional files changed unexpectedly, inspect them before staging. Do not
commit if the scanner fails.

7. Check recent commit style and commit with the version as the message.

```sh
git log --oneline -5
git commit -m "<version>"
```

8. Create and push the matching tag.

```sh
git tag v<version>
git push origin main
git push origin v<version>
```

9. Wait for GitHub Actions.

```sh
gh run list --repo mkusaka/ts-no-unused --limit 10 --json databaseId,workflowName,status,conclusion,headSha,url,event,displayTitle
gh run view <run-id> --repo mkusaka/ts-no-unused --json status,conclusion,workflowName,headSha,url,jobs
```

For a tag release, both `test` and `Release` should pass.

10. Check publication state.

The `Release` workflow uses `npm stage publish`, so success means the package
is staged, not necessarily live on npm. Confirm live state with:

```sh
npm view ts-no-unused version dist-tags versions --json
```

If the new version is still absent, tell the user to approve the staged package
on npmjs.com. After approval, re-run the npm view command.

## Guardrails

- Use `gh` for GitHub operations.
- Do not print, persist, or pass real npm/GitHub tokens.
- Do not write release notes manually unless asked; the workflow uses generated
  GitHub release notes.
- If a release run creates a GitHub Release but npm is still 404, treat that as
  normal staged publishing until npm approval is complete.
