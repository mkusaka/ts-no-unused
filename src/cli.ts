import meow from "meow";
import { join } from "path";
import { Project } from "ts-morph";

const consoleLog =
  (level: string) =>
  (...logs: any[]) => {
    if (level === "none") {
      return;
    }
    console.log(...logs);
  };

const cli = meow(
  `
  Usage
    $ npx ts-no-unused
    $ npx ts-no-unused --tsconfig-path ./src/tsconfig.json
    $ npx ts-no-unused --logLevel debug`,
  {
    importMeta: import.meta,
    flags: {
      tsconfigPath: {
        type: "string",
        default: join(process.cwd(), "tsconfig.json"),
        description: "Path to tsconfig.json",
      },
      logLevel: {
        type: "string",
        default: "none",
        description: "Log level",
      },
    },
  }
);

const tsconfigPath = cli.flags.tsconfigPath;
const logLevel = cli.flags.logLevel;
const logger = consoleLog(logLevel);

const project = new Project({
  tsConfigFilePath: tsconfigPath,
});

const sourceFiles = project.getSourceFiles();

for (const sourceFile of sourceFiles) {
  logger(`start remove: ${sourceFile.getFilePath()} unused identifier`);
  sourceFile.fixUnusedIdentifiers();
  sourceFile.saveSync();
  logger(`done remove: ${sourceFile.getFilePath()} unused identifier`);
}
