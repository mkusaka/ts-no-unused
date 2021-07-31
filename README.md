# ts-no-unused
auto remove no-unused-locals and parameters detected by typescript.

If we use typescript with noUnusedLocals or noUnusedParameters, compiler raise error if no unused local or parameter is detected.

This cli provide a way to remove unused local and parameter automatically.

# install

```bash
npm install -g ts-no-unused
```

# usage

With no option, cli detect and fix under current project files. (tsconfig.json must be under current path.)
```bash
ts-no-unused
```

Can specify tsconfig.json file via --configPath option.

```bash
ts-no-unused --configPath ./relativeProject/tsconfig.json
```

Can filter target files via glob pattern.

```bash
ts-no-unused --target './src/nest/*.ts'
```
