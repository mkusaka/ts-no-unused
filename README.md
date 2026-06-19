# ts-no-unused

Automatically remove unused locals and parameters detected by TypeScript.

# motivation

If you use TypeScript with the `noUnusedLocals` or `noUnusedParameters`
option, the compiler raises an error when it detects an unused local or
parameter.

This CLI provides a way to remove unused locals and parameters automatically.

# install

```bash
npm install -g ts-no-unused
```

# usage

With no option, the CLI detects and fixes files in the current project.
`tsconfig.json` must exist in the current directory.

```bash
ts-no-unused
```

You can specify a `tsconfig.json` file with `--tsconfig-path`.

```bash
ts-no-unused --tsconfig-path ./relativeProject/tsconfig.json
```

The documented `--configPath` alias is also supported for compatibility.

You can filter target files with a glob pattern.

```bash
ts-no-unused --target './src/nest/*.ts'
```

# release

Release tags are staged on npm through GitHub Actions trusted publishing.

1. Bump `package.json` without creating a tag automatically.

```bash
npm version patch --no-git-tag-version
```

2. Run local checks, commit the version bump, then create and push the release
   tag.

```bash
pnpm run check
pnpm run publish:dry
git tag v0.0.12
git push origin HEAD
git push origin v0.0.12
```

The `Release` workflow runs `npm stage publish`, then creates a GitHub Release.
Approve the staged package on npmjs.com with 2FA to make it public.

Configure npm Trusted Publisher for this package with:

- Publisher: GitHub Actions
- Organization or user: `mkusaka`
- Repository: `ts-no-unused`
- Workflow filename: `release.yml`
- Allowed action: `npm stage publish`
