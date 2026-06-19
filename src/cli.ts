import meow from "meow";
import { isAbsolute, normalize, resolve } from "node:path";
import { Project } from "ts-morph";
import fg from "fast-glob";

type Logger = (...logs: unknown[]) => void;

export type TsNoUnusedOptions = {
  cwd?: string;
  logger?: Logger;
  targetPattern?: string;
  tsconfigPath: string;
};

export type TsNoUnusedResult = {
  processedFiles: string[];
  skippedFiles: string[];
};

type MainOptions = {
  cwd?: string;
  logger?: Logger;
};

const helpText = `
  Usage
    $ npx ts-no-unused
    $ npx ts-no-unused --tsconfig-path ./src/tsconfig.json
    $ npx ts-no-unused --verbose
    $ npx ts-no-unused --target './src/nest/*.ts'`;

const createLogger =
  (verbose: boolean, logger: Logger): Logger =>
  (...logs) => {
    if (verbose) {
      logger(...logs);
    }
  };

export function runTsNoUnused({
  cwd = process.cwd(),
  logger = () => {},
  targetPattern = "**/*",
  tsconfigPath,
}: TsNoUnusedOptions): TsNoUnusedResult {
  const project = new Project({
    tsConfigFilePath: resolvePath(cwd, tsconfigPath),
  });

  // FIXME: use ts-morph's getSourceFiles() with glob pattern. such as: project.getSourceFiles(targetPattern);
  // but it doesn't work well now.
  const targetFiles = new Set(
    fg
      .sync(targetPattern, {
        absolute: true,
        cwd,
        ignore: ["**/node_modules/**"],
        onlyFiles: true,
      })
      .map(normalizeFilePath),
  );
  const processedFiles: string[] = [];
  const skippedFiles: string[] = [];

  for (const sourceFile of project.getSourceFiles()) {
    const filePath = normalizeFilePath(sourceFile.getFilePath());

    if (!targetFiles.has(filePath)) {
      logger(`skip file: ${filePath}`);
      skippedFiles.push(filePath);
      continue;
    }

    logger(`start remove: ${filePath} unused identifier`);
    sourceFile.fixUnusedIdentifiers();
    sourceFile.saveSync();
    logger(`done remove: ${filePath} unused identifier`);
    processedFiles.push(filePath);
  }

  return { processedFiles, skippedFiles };
}

export function main(
  argv: readonly string[] = process.argv.slice(2),
  { cwd = process.cwd(), logger = console.log }: MainOptions = {},
): TsNoUnusedResult {
  const cli = meow(helpText, {
    importMeta: import.meta,
    argv,
    flags: {
      tsconfigPath: {
        type: "string",
        default: "tsconfig.json",
        aliases: ["configPath", "config-path"],
        description: "Path to tsconfig.json",
      },
      verbose: {
        type: "boolean",
        default: false,
        description: "verbose or not",
      },
      target: {
        type: "string",
        default: "**/*",
        description: "Target file glob patterns",
      },
    },
  });

  return runTsNoUnused({
    cwd,
    logger: createLogger(cli.flags.verbose, logger),
    targetPattern: cli.flags.target,
    tsconfigPath: cli.flags.tsconfigPath,
  });
}

function resolvePath(cwd: string, filePath: string): string {
  return isAbsolute(filePath) ? filePath : resolve(cwd, filePath);
}

function normalizeFilePath(filePath: string): string {
  return normalize(filePath);
}
