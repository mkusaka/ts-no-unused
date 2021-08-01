import meow from "meow";
import { join } from "path";
import { Project } from "ts-morph";
import fg from "fast-glob";

const consoleLog =
  (verbose: boolean) =>
  (...logs: any[]) => {
    if (!verbose) {
      return;
    }
    console.log(...logs);
  };

const cli = meow(
  `
  Usage
    $ npx ts-no-unused
    $ npx ts-no-unused --tsconfig-path ./src/tsconfig.json
    $ npx ts-no-unused --verbose`,
  {
    importMeta: import.meta,
    flags: {
      tsconfigPath: {
        type: "string",
        default: join(process.cwd(), "tsconfig.json"),
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
      }
    },
  }
);

const tsconfigPath = cli.flags.tsconfigPath;
const verbose = cli.flags.verbose;
const targetPattern = cli.flags.target;

const logger = consoleLog(verbose);

const project = new Project({
  tsConfigFilePath: tsconfigPath,
});

// FIXME: use ts-morph's getSourceFiles() with glob pattern. such as: project.getSourceFiles(targetPattern);
// but it doesn't work well now.
const targetFiles = fg.sync(join(process.cwd(), targetPattern), { ignore: ['**/node_modules/**'] });
const sourceFiles = project.getSourceFiles();

for (const sourceFile of sourceFiles) {
  if (!targetFiles.includes(sourceFile.getFilePath())) {
    logger(`skip file: ${sourceFile.getFilePath()}`);
    continue;
  }
  logger(`start remove: ${sourceFile.getFilePath()} unused identifier`);
  sourceFile.fixUnusedIdentifiers();
  sourceFile.saveSync();
  logger(`done remove: ${sourceFile.getFilePath()} unused identifier`);
}
