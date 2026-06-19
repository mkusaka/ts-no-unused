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
